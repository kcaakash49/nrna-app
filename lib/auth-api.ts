import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function requireRoleApi(roles: UserRole[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    return { ok: false as const, status: 401, user: null };
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return { ok: false as const, status: 401, user: null };

  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return { ok: false as const, status: 401, user: null };
  }

  if (!session.user.isActive) return { ok: false as const, status: 403, user: null };

  if (!roles.includes(session.user.role)) {
    return { ok: false as const, status: 403, user: null };
  }

  // Optional: update lastUsedAt occasionally (avoid updating every request)
  // await prisma.adminSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });

  return { ok: true as const, status: 200, user: session.user };
}