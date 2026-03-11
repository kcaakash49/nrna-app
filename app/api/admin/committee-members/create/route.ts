import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const UPLOAD_DIR = "/var/www/nrna/uploads/members";
const PUBLIC_URL_PREFIX = "/uploads/members";

function slugPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function POST(req: NextRequest) {
  let savedFilePath: string | null = null;

  try {
    const admin = await requireAdmin();
    const formData = await req.formData();

    const name = String(formData.get("name") || "").trim();
    const designation = String(formData.get("designation") || "").trim();
    const countryRaw = String(formData.get("country") || "").trim();
    const tenureId = String(formData.get("tenureId") || "").trim();
    const teamTypeId = String(formData.get("teamTypeId") || "").trim();
    const groupId = String(formData.get("groupId") || "").trim();
    const orderRaw = String(formData.get("order") || "").trim();
    const isActiveRaw = String(formData.get("isActive") || "true").trim();

    const image = formData.get("image");

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!designation) {
      return NextResponse.json(
        { ok: false, error: "Designation is required" },
        { status: 400 }
      );
    }

    if (!tenureId || !teamTypeId || !groupId) {
      return NextResponse.json(
        { ok: false, error: "Tenure, team type and group are required" },
        { status: 400 }
      );
    }

    const order = Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : 100;
    const isActive = isActiveRaw === "true";

    const [tenure, teamType, group] = await Promise.all([
      prisma.tenure.findUnique({
        where: { id: tenureId },
        select: { id: true },
      }),
      prisma.teamType.findUnique({
        where: { id: teamTypeId },
        select: { id: true },
      }),
      prisma.committeeGroup.findUnique({
        where: { id: groupId },
        select: { id: true },
      }),
    ]);

    if (!tenure || !teamType || !group) {
      return NextResponse.json(
        { ok: false, error: "Invalid tenure, team type or group" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (image && image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { ok: false, error: "Uploaded file must be an image" },
          { status: 400 }
        );
      }

      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

      const uniqueName = `${Date.now()}-${slugPart(name)}.webp`;
      savedFilePath = path.join(UPLOAD_DIR, uniqueName);

      const buffer = Buffer.from(await image.arrayBuffer());

      const optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({
          width: 1200,
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      await fs.promises.writeFile(savedFilePath, optimizedBuffer);

      imageUrl = `${PUBLIC_URL_PREFIX}/${uniqueName}`;
    }

    if(!imageUrl){
        return NextResponse.json(
          { ok: false, error: "Image upload failed" },
          { status: 500 }
        );
    }

    const created = await prisma.committeeMember.create({
      data: {
        name,
        designation,
        country: countryRaw || null,
        imageUrl,
        tenureId,
        teamTypeId,
        groupId,
        order,
        isActive,
        createdById: admin.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Committee member created successfully",
      data: created,
    });
  } catch (error) {
    if (savedFilePath) {
      try {
        await fs.promises.unlink(savedFilePath);
      } catch (unlinkError) {
        console.error("Failed to unlink uploaded member image:", unlinkError);
      }
    }

    console.error("POST /api/admin/committee-members/create error:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to create committee member" },
      { status: 500 }
    );
  }
}