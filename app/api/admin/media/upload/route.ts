import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/auth-api";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs"; // required for fs access

function safeExtFromName(name: string) {
  const ext = path.extname(name || "").toLowerCase();
  // basic guard
  if (ext.length > 10) return "";
  return ext;
}

async function writeWebFileToDisk(file: File, destPath: string) {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

  // stream from web File -> node stream -> file
  const webStream = file.stream();
  const nodeStream = Readable.fromWeb(webStream as any);

  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(destPath);
    nodeStream.pipe(out);
    out.on("finish", () => resolve());
    out.on("error", reject);
    nodeStream.on("error", reject);
  });
}

export async function POST(req: Request) {
  console.log("I am here");
  const auth = await requireRoleApi([UserRole.SUPER_ADMIN, UserRole.EDITOR]);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const uploadDir = process.env.UPLOAD_DIR;
  const baseUrl = process.env.UPLOAD_BASE_URL ?? "/uploads";
  if (!uploadDir) {
    return NextResponse.json({ error: "UPLOAD_DIR is missing" }, { status: 500 });
  }

  const form = await req.formData();

  // Expect: <input name="files" type="file" multiple />
  const files = form.getAll("files").filter((x): x is File => x instanceof File);

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded (field name must be 'files')" }, { status: 400 });
  }

  // basic limits (tune)
  const MAX_FILES = 20;
  const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB per file
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 400 });
  }

  const saved = [];
  for (const file of files) {
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
    }

    const ext = safeExtFromName(file.name);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const storedPath = path.join(uploadDir, storedName);

    await writeWebFileToDisk(file, storedPath);

    const media = await prisma.media.create({
      data: {
        originalName: file.name,
        storedName,
        path: storedPath,
        url: `${baseUrl}/${storedName}`,
        mimeType: file.type || "application/octet-stream",
        uploadedById: auth.user!.id,
      },
    });

    saved.push(media);
  }

  return NextResponse.json({ items: saved }, { status: 201 });
}