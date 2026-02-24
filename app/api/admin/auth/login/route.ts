import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { getRequestMeta } from "@/lib/request-meta";

export async function POST(req: Request) {
  const { ipAddress, userAgent } = getRequestMeta(req);

  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  // Don’t reveal whether email exists
  if (!user) {
    await auditLog({
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      meta: { email, reason: "user_not_found" },
      ipAddress,
      userAgent,
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await auditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      meta: { email, reason: "wrong_password" },
      ipAddress,
      userAgent,
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // create random session token
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const session = await prisma.adminSession.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      ip:ipAddress,
      userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("admin_session", rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  await auditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "AUTH",
    entityId: session.id,
    meta: { email },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true });
}