import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  console.log("Fetching COmmmittee members");
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || "10"), 1);

    const tenureId = searchParams.get("tenureId") || undefined;
    const teamTypeId = searchParams.get("teamTypeId") || undefined;
    const groupId = searchParams.get("groupId") || undefined;
    const q = searchParams.get("q")?.trim() || undefined;

    const where = {
      ...(tenureId ? { tenureId } : {}),
      ...(teamTypeId ? { teamTypeId } : {}),
      ...(groupId ? { groupId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { designation: { contains: q, mode: "insensitive" as const } },
              { country: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.committeeMember.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          tenure: {
            select: {
              id: true,
              label: true,
            },
          },
          teamType: {
            select: {
              id: true,
              name: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.committeeMember.count({ where }),
    ]);
    const data = {
      ok: true,
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
   
    return NextResponse.json(data, { status: 200});
  } catch (error) {
    console.error("GET /api/admin/committee-members error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load committee members" },
      { status: 500 },
    );
  }
}
