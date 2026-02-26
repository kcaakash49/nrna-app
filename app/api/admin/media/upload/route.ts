import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { requireRoleApi } from "@/lib/auth-api";
import { UserRole } from "@prisma/client";
import sharp from "sharp";

export const runtime = "nodejs"; // required for fs access

function safeExtFromName(name: string) {
  const ext = path.extname(name || "").toLowerCase();
  // basic guard
  if (ext.length > 10) return "";
  return ext;
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
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

  const items = [];
  for (const file of files) {

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");

  let storedName: string;
  let diskPath: string;
  let mimeType = file.type || "application/octet-stream";

  if (isImage) {
    storedName = `${crypto.randomUUID()}.webp`;
    diskPath = path.join(uploadDir, storedName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await sharp(buffer)
      .rotate() // auto orientation
      .webp({ quality: 82 }) // tweak quality
      .toFile(diskPath);

    mimeType = "image/webp";

  } else {
    const ext = safeExtFromName(file.name);
    storedName = `${crypto.randomUUID()}${ext}`;
    diskPath = path.join(uploadDir, storedName);

    await writeWebFileToDisk(file, diskPath);
  }

  const cleanName = stripExtension(file.name)
  const media = await prisma.media.create({
    data: {
      originalName: cleanName,
      storedName,
      path: diskPath,
      url: `${baseUrl}/${storedName}`,
      mimeType,
      uploadedById: auth.user!.id,
    },
  });

  items.push(media);
}

  return NextResponse.json({ items: items }, { status: 201 });
}