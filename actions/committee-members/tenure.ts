"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type CreateTenureInput = {
  label: string;
  startYear?: number | null;
  endYear?: number | null;
  order?: number;
  isActive?: boolean;
};

export async function createTenure(input: CreateTenureInput) {
  await requireAdmin();

  const label = input.label.trim();
  const startYear = input.startYear ?? null;
  const endYear = input.endYear ?? null;
  const order = Number.isFinite(input.order) ? Number(input.order) : 0;
  const isActive = typeof input.isActive === "boolean" ? input.isActive : true;

  if (!label) {
    throw new Error("Tenure label is required");
  }

  const existing = await prisma.tenure.findUnique({
    where: { label },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Tenure already exists");
  }

  const created = await prisma.tenure.create({
    data: {
      label,
      startYear,
      endYear,
      order,
      isActive,
    },
    select: {
      id: true,
      label: true,
      startYear: true,
      endYear: true,
      order: true,
      isActive: true,
    },
  });

  return created;
}