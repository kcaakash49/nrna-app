"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkType } from "@prisma/client";
import { revalidatePath } from "next/cache";

function normalizeKey(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "_");
}

//creating Menu Sections like MAIN_MENU or FOOTER_MENU
export async function createMenu(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const keyRaw = String(formData.get("key") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { ok: false, error: "Menu name is required." };
  }
  if (!keyRaw) {
    return { ok: false, error: "Menu key is required." };
  }

  const key = normalizeKey(keyRaw);

  try {
    await prisma.menu.create({
      data: {
        name,
        key,
        isActive,
      },
    });

    revalidatePath("/admin/menus");
    return { ok: true };
  } catch (err: any) {
    // Prisma unique constraint
    if (err?.code === "P2002") {
      return {
        ok: false,
        error: "Menu key already exists. Use a different key.",
      };
    }
    return { ok: false, error: "Failed to create menu." };
  }
}


