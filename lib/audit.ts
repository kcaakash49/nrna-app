import { prisma } from "@/lib/prisma";

export type AuditEntityType =
  | "AUTH"
  | "USER"
  | "POST"
  | "EVENT"
  | "DOWNLOAD"
  | "MEDIA"
  | "MENU"
  | "MENU_ITEM"
  | "GALLERY_ALBUM"
  | "GALLERY_PHOTO"
  | "SITE_SETTINGS";

export async function auditLog(params: {
  userId?: string | null;
  action: string; // e.g. LOGIN_SUCCESS, POST_CREATE, POST_UPDATE...
  entityType: AuditEntityType;
  entityId?: string | null;
  meta?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      meta: params.meta ?? undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}