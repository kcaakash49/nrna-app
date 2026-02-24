// src/lib/authz.ts
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function getAdminOrNull() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return null;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireAdmin() {
  const admin = await getAdminOrNull();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireRole(roles: Array<"SUPER_ADMIN" | "EDITOR" | "VIEWER">) {
  const admin = await requireAdmin();
  if (!roles.includes(admin.role as UserRole)) redirect("/admin/forbidden");
  return admin;
}