"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import Link from "next/link";
import { createMenu } from "@/actions/menus/menus";
import { useRouter } from "next/navigation";

export default function NewMenuPage() {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <div className="mx-auto max-w-7xl py-10">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Create Menu</h1>
                <Link className="text-sm underline" href="/admin/menus">
                    Back
                </Link>
            </div>

            <form
                className="space-y-5 rounded-2xl border bg-white p-6"
                action={(fd) => {
                    startTransition(async () => {
                        const res = await createMenu(fd);

                        if (!res.ok) {
                            toast.error(res.error);
                            return;
                        }

                        toast.success("Menu created");
                        router.replace("/admin/menus");
                    });
                }}
            >
                <div className="space-y-2">
                    <label className="text-sm font-medium">Menu Name</label>
                    <input
                        name="name"
                        placeholder="Main Navbar"
                        className="h-10 w-full rounded-xl border px-3 outline-none"
                        disabled={pending}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Menu Key</label>
                    <input
                        name="key"
                        placeholder="MAIN_NAV"
                        className="h-10 w-full rounded-xl border px-3 font-mono outline-none"
                        disabled={pending}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Will be normalized to uppercase with underscores (e.g. <span className="font-mono">MAIN_NAV</span>).
                    </p>
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input name="isActive" type="checkbox" defaultChecked disabled={pending} />
                    Active
                </label>

                <button
                    type="submit"
                    disabled={pending}
                    className="h-10 w-full rounded-xl bg-black text-sm font-medium text-white disabled:opacity-50"
                >
                    {pending ? "Creating..." : "Create Menu"}
                </button>
            </form>
        </div>
    );
}