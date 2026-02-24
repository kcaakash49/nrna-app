import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { getRequestMeta } from "@/lib/request-meta";

export async function POST(req: Request) {
  const { ipAddress, userAgent } = getRequestMeta(req);

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (session) {
      await auditLog({
        userId: session.userId,
        action: "LOGOUT",
        entityType: "AUTH",
        entityId: session.id,
        ipAddress,
        userAgent,
      });

      await prisma.adminSession.delete({ where: { id: session.id } });
    }
  }

  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true });
}