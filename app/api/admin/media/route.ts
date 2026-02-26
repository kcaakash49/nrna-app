import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/auth-api";
import { UserRole } from "@prisma/client";

export async function GET(req: Request) {
  console.log("fetching..................")
  const auth = await requireRoleApi([UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.VIEWER]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "24"), 60);
  const skip = (Math.max(page, 1) - 1) * pageSize;

  const where = q
    ? {
        OR: [
          { originalName: { contains: q, mode: "insensitive" as const } },
          { mimeType: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.media.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}