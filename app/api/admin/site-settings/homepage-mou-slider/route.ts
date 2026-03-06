import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

const SETTING_KEY = "homepage_mou_slider";

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const value = setting?.value as { imageIds?: string[] } | null;
    const imageIds = Array.isArray(value?.imageIds) ? value!.imageIds.slice(0, 5) : [];

    if (!imageIds.length) {
      return NextResponse.json({
        key: SETTING_KEY,
        imageIds: [],
        items: [],
      });
    }

    const medias = await prisma.media.findMany({
      where: {
        id: { in: imageIds },
      },
      select: {
        id: true,
        url: true,
        originalName: true,
        mimeType: true,
      },
    });

    const ordered = imageIds
      .map((id) => medias.find((m) => m.id === id))
      .filter(Boolean);

    return NextResponse.json({
      key: SETTING_KEY,
      imageIds,
      items: ordered,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load homepage slider setting" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const imageIds = Array.isArray(body?.imageIds) ? body.imageIds.slice(0, 5) : [];

    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: { imageIds },
        updatedById: admin.id,
      },
      create: {
        key: SETTING_KEY,
        value: { imageIds },
        updatedById: admin.id,
      },
    });

    revalidatePath("/admin/site-settings");
    revalidateTag("site-setting:homepage_mou_slider","max");
    return NextResponse.json({
      ok: true,
      message: "Homepage slider updated successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update homepage slider setting" },
      { status: 500 }
    );
  }
}