"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth"; 

export async function upsertSiteSetting(formData: FormData) {
  const admin = await requireAdmin();

  const id = String(formData.get("id") || "");
  const key = String(formData.get("key") || "").trim();
  const rawValue = String(formData.get("value") || "").trim();

  if (!key) {
    return { ok: false, error: "Key is required" };
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    return { ok: false, error: "Value must be valid JSON" };
  }

  try {
    if (id) {
      const existing = await prisma.siteSetting.findUnique({
        where: { id },
      });

      if (!existing) {
        return { ok: false, error: "Setting not found" };
      }

      const duplicate = await prisma.siteSetting.findFirst({
        where: {
          key,
          NOT: { id },
        },
      });

      if (duplicate) {
        return { ok: false, error: "A setting with this key already exists" };
      }

      await prisma.siteSetting.update({
        where: { id },
        data: {
          key,
          value: parsedValue as any,
          updatedById: admin.id,
        },
      });
    } else {
      const duplicate = await prisma.siteSetting.findUnique({
        where: { key },
      });

      if (duplicate) {
        return { ok: false, error: "A setting with this key already exists" };
      }

      await prisma.siteSetting.create({
        data: {
          key,
          value: parsedValue as any,
          updatedById: admin.id,
        },
      });
    }

    revalidatePath("/admin/site-settings");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Failed to save setting" };
  }
}

export async function deleteSiteSetting(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");

  if (!id) {
    return { ok: false, error: "Missing setting id" };
  }

  try {
    await prisma.siteSetting.delete({
      where: { id },
    });

    revalidatePath("/admin/site-settings");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Failed to delete setting" };
  }
}