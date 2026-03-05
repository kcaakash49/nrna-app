"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createMenuItem } from "@/actions/menus/menu-items";
import type {
    LinkType,
    MenuItemKind,
    Visibility,
    Language,
} from "@prisma/client";
import { useRouter } from "next/navigation";

type Menu = { id: string; name: string; key: string };
type ParentItem = { id: string; label: string; menuId: string; parentId: string | null, kind: MenuItemKind };
type PagePost = { id: string; title: string; slug: string; lang: Language };
type Event = { id: string; title: string; slug: string; lang: Language; status: string };
type EventCategory = { id: string; name: string; slug: string; parentId: string | null };

function buildCategoryLabel(cat: EventCategory, byId: Map<string, EventCategory>) {
    const parts: string[] = [];
    let cur: EventCategory | undefined = cat;
    let guard = 0;
    while (cur && guard++ < 20) {
        parts.unshift(cur.name);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return parts.join(" / ");
}

export default function MenuItemCreateForm({
    menus,
    menuItems,
    pagePosts,
    events,
    eventCategories,
}: {
    menus: Menu[];
    menuItems: ParentItem[];
    pagePosts: PagePost[];
    events: Event[];
    eventCategories: EventCategory[];
}) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const defaultMenuId = menus[0]?.id ?? "";
    const [menuId, setMenuId] = useState(defaultMenuId);

    const [kind, setKind] = useState<MenuItemKind>("URL" as MenuItemKind);
    const [linkType, setLinkType] = useState<LinkType>("INTERNAL" as LinkType);

    const parentsForMenu = useMemo(
        () =>
            menuItems.filter(
                (i) =>
                    i.menuId === menuId &&
                    i.kind === "DROPDOWN" // only dropdown items can be parents
            ),
        [menuItems, menuId]
    );

    const catsById = useMemo(() => {
        const m = new Map<string, EventCategory>();
        eventCategories.forEach((c) => m.set(c.id, c));
        return m;
    }, [eventCategories]);

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-xl font-semibold">Create Menu Item</h1>

            <form
                className="space-y-6 rounded-2xl border bg-white p-6"
                action={(fd) => {
                    startTransition(async () => {
                        const res = await createMenuItem(fd);
                        if (!res.ok) {
                            toast.error(res.error);
                            return
                        }
                        toast.success("Menu item created");
                        formRef.current?.reset();
                        setKind("URL");
                        setLinkType("INTERNAL");
                        setMenuId(defaultMenuId);
                        router.refresh();

                    });
                }}
            >
                {/* Menu */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Menu</label>
                    <select
                        name="menuId"
                        value={menuId}
                        onChange={(e) => setMenuId(e.target.value)}
                        className="h-10 w-full rounded-xl border px-3 outline-none"
                        disabled={pending}
                    >
                        {menus.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} ({m.key})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Parent */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Parent (optional)</label>
                    <select
                        name="parentId"
                        className="h-10 w-full rounded-xl border px-3 outline-none"
                        disabled={pending}
                        defaultValue=""
                    >
                        <option value="">None (top-level)</option>
                        {parentsForMenu.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                        Pick a parent to make this a dropdown item.
                    </p>
                </div>

                {/* Label + Order */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Label</label>
                        <input
                            name="label"
                            placeholder="e.g. About Us"
                            className="h-10 w-full rounded-xl border px-3 outline-none"
                            disabled={pending}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Order</label>
                        <input
                            name="order"
                            type="number"
                            min={0}
                            defaultValue={0}
                            className="h-10 w-full rounded-xl border px-3 outline-none"
                            disabled={pending}
                        />
                    </div>
                </div>

                {/* Kind */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Item Type</label>
                    <select
                        name="kind"
                        value={kind}
                        onChange={(e) => setKind(e.target.value as MenuItemKind)}
                        className="h-10 w-full rounded-xl border px-3 outline-none"
                        disabled={pending}
                    >
                        <option value="URL">URL</option>
                        <option value="POST_PAGE">Post Page</option>
                        <option value="EVENT">Event</option>
                        <option value="EVENT_CATEGORY">Event Category</option>
                        <option value="DROPDOWN">Dropdown Only (no link)</option>
                    </select>
                </div>

                {/* URL fields */}
                {kind === ("URL" as MenuItemKind) && (
                    <div className="space-y-4 rounded-xl border p-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link Type</label>
                            <select
                                name="linkType"
                                value={linkType}
                                onChange={(e) => setLinkType(e.target.value as LinkType)}
                                className="h-10 w-full rounded-xl border px-3 outline-none"
                                disabled={pending}
                            >
                                <option value="INTERNAL">Internal</option>
                                <option value="EXTERNAL">External</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">URL</label>
                            <input
                                name="url"
                                placeholder={linkType === "EXTERNAL" ? "https://example.com" : "/news"}
                                className="h-10 w-full rounded-xl border px-3 outline-none"
                                disabled={pending}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Internal examples: <span className="font-mono">/</span>,{" "}
                                <span className="font-mono">/gallery</span>,{" "}
                                <span className="font-mono">/news</span>,{" "}
                                <span className="font-mono">/events</span>
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input name="openInNewTab" type="checkbox" disabled={pending} />
                            Open in new tab
                        </label>
                    </div>
                )}

                {/* Reference selectors */}
                {(kind === ("POST_PAGE" as MenuItemKind) ||
                    kind === ("EVENT" as MenuItemKind) ||
                    kind === ("EVENT_CATEGORY" as MenuItemKind)) && (
                        <div className="space-y-3 rounded-xl border p-4">
                            <input type="hidden" name="refType" value="" />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {kind === "POST_PAGE"
                                        ? "Select Post Page"
                                        : kind === "EVENT"
                                            ? "Select Event"
                                            : "Select Event Category"}
                                </label>

                                {kind === "POST_PAGE" && (
                                    <select
                                        name="refId"
                                        className="h-10 w-full rounded-xl border px-3 outline-none"
                                        disabled={pending}
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Choose a page...
                                        </option>
                                        {pagePosts.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title} ({p.slug}) [{p.lang}]
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {kind === "EVENT" && (
                                    <select
                                        name="refId"
                                        className="h-10 w-full rounded-xl border px-3 outline-none"
                                        disabled={pending}
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Choose an event...
                                        </option>
                                        {events.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.title} ({e.slug}) [{e.lang}] — {e.status}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {kind === "EVENT_CATEGORY" && (
                                    <select
                                        name="refId"
                                        className="h-10 w-full rounded-xl border px-3 outline-none"
                                        disabled={pending}
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Choose a category...
                                        </option>
                                        {eventCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {buildCategoryLabel(c, catsById)} ({c.slug})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    We’ll generate the URL automatically from the selected item’s slug.
                                </p>
                            </div>
                        </div>
                    )}

                {/* Dropdown-only hint */}
                {kind === ("DROPDOWN" as MenuItemKind) && (
                    <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                        This item will be a dropdown label only (not clickable). Add children under it.
                    </div>
                )}

                {/* Visibility / Lang / Active */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Visibility</label>
                        <select
                            name="visibility"
                            defaultValue={"PUBLIC" satisfies Visibility}
                            className="h-10 w-full rounded-xl border px-3 outline-none"
                            disabled={pending}
                        >
                            <option value="PUBLIC">Public</option>
                            <option value="ADMIN_ONLY">Admin only</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Language (optional)</label>
                        <select
                            name="lang"
                            defaultValue=""
                            className="h-10 w-full rounded-xl border px-3 outline-none"
                            disabled={pending}
                        >
                            <option value="">All</option>
                            <option value="EN">EN</option>
                            <option value="NP">NP</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                            <input name="isActive" type="checkbox" defaultChecked disabled={pending} />
                            Active
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={pending}
                    className="h-10 w-full rounded-xl bg-black text-sm font-medium text-white disabled:opacity-50"
                >
                    {pending ? "Creating..." : "Create Menu Item"}
                </button>
            </form>
        </div>
    );
}