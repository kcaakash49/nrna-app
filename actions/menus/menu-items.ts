"use server";

import {prisma} from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  LinkType,
  MenuItemKind,
  MenuRefType,
  Visibility,
  Language,
} from "@prisma/client";

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

export async function createMenuItem(formData: FormData) {
  const menuId = String(formData.get("menuId") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw ? parentIdRaw : null;

  const label = String(formData.get("label") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);

  const kind = String(formData.get("kind") ?? "URL") as MenuItemKind;

  const urlRaw = String(formData.get("url") ?? "").trim();
  const url = urlRaw ? urlRaw : null;

  const linkType = String(formData.get("linkType") ?? "INTERNAL") as LinkType;
  const openInNewTab = formData.get("openInNewTab") === "on";

  const isActive = formData.get("isActive") === "on";

  const visibility = String(
    formData.get("visibility") ?? "PUBLIC"
  ) as Visibility;

  const langRaw = String(formData.get("lang") ?? "").trim();
  const lang = (langRaw ? langRaw : null) as Language | null;

  const refIdRaw = String(formData.get("refId") ?? "").trim();
  const refId = refIdRaw ? refIdRaw : null;

  // derive refType from kind (keeps data consistent)
  let refType: MenuRefType | null = null;
  if (kind === "POST_PAGE") refType = "POST";
  if (kind === "EVENT") refType = "EVENT";
  if (kind === "EVENT_CATEGORY") refType = "EVENT_CATEGORY";

  if (!menuId) return { ok: false, error: "Menu is required." };
  if (!label) return { ok: false, error: "Label is required." };
  if (Number.isNaN(order) || order < 0)
    return { ok: false, error: "Order must be 0 or greater." };

  // Validation by kind
  if (kind === "URL") {
    if (!url) return { ok: false, error: "URL is required for URL kind." };

    if (linkType === "EXTERNAL" && !isExternalUrl(url)) {
      return { ok: false, error: "External URL must start with http:// or https://." };
    }

    // Optional: internal urls should start with "/"
    if (linkType === "INTERNAL" && !url.startsWith("/")) {
      return { ok: false, error: "Internal URL should start with /" };
    }
  }

  if (kind === "POST_PAGE" || kind === "EVENT" || kind === "EVENT_CATEGORY") {
    if (!refId) return { ok: false, error: "You must select a reference item." };
  }

  if (kind === "DROPDOWN") {
    // no url/ref needed
  }

  try {
    await prisma.menuItem.create({
      data: {
        menuId,
        parentId,
        order,
        label,

        kind,

        // URL fields
        url: kind === "URL" ? url : null,
        linkType: kind === "URL" ? linkType : "INTERNAL",
        openInNewTab: kind === "URL" ? openInNewTab : false,

        // publish controls
        isActive,
        visibility,
        lang,

        // reference fields
        refType,
        refId: refType ? refId : null,
      },
    });

    revalidatePath("/admin/menu-items");
    revalidatePath("/admin/menus"); 
    revalidateTag("navbar-menu", "max");
    return { ok: true };
  } catch (err) {
    console.error("createMenuItem error:", err);
    return { ok: false, error: "Failed to create menu item." };
  }
}