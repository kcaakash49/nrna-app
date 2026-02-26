"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export async function fetchParentCategories() {
  try {
    const result = await prisma.eventCategory.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
        },
      },
      orderBy: {
        order: "desc",
      },
    });

    return { success: true, result };
  } catch (e) {
    console.error(e);
    return { success: false, result: [] };
  }
}

export async function createEventCategory(formData: FormData) {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, error: "Unauthorized" };

    const name = String(formData.get("name") ?? "").trim();
    const slugRaw = String(formData.get("slug") ?? "").trim() || name;
    const parentIdRaw = String(formData.get("parentId") ?? "").trim();
    const orderRaw = String(formData.get("order") ?? "0").trim();
    const isActive = formData.get("isActive") === "on";

    if (!name) return { ok: false, error: "Name is required." };

    const parentId = parentIdRaw || null;
    const slug = slugify(slugRaw);
    const order = Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : 0;

    if (!parentId) {
      const existingRoot = await prisma.eventCategory.findFirst({
        where: { parentId: null, slug },
        select: { id: true },
      });
      if (existingRoot) return { ok: false, error: "Category already exists." };
    }

    const created = await prisma.eventCategory.create({
      data: { name, slug, parentId, order, isActive },
    });

    revalidatePath("/admin/event-category");
    return { ok: true, category: created };
  } catch (e) {
    console.error(e);

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return { ok: false, error: "This category slug already exists under the selected parent." };
      }
    }

    return { ok: false, error: "Server Error!!!" };
  }
}
