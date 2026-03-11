"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type CreateCommitteeMetaInput = {
  type: "teamType" | "group";
  name: string;
  order?: number;
  isActive?: boolean;
};

export async function createCommitteeMeta(input: CreateCommitteeMetaInput) {
  await requireAdmin();

  const name = input.name.trim();
  const order = Number.isFinite(input.order) ? Number(input.order) : 0;
  const isActive = typeof input.isActive === "boolean" ? input.isActive : true;

  if (!name) {
    throw new Error(
      input.type === "teamType" ? "Team type name is required" : "Group name is required"
    );
  }

  if (input.type === "teamType") {
    const existing = await prisma.teamType.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      throw new Error("Team type already exists");
    }

    return prisma.teamType.create({
      data: {
        name,
        order,
        isActive,
      },
      select: {
        id: true,
        name: true,
        order: true,
        isActive: true,
      },
    });
  }

  const existing = await prisma.committeeGroup.findUnique({
    where: { name },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Group already exists");
  }

  return prisma.committeeGroup.create({
    data: {
      name,
      order,
      isActive,
    },
    select: {
      id: true,
      name: true,
      order: true,
      isActive: true,
    },
  });
}