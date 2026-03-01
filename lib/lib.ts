export function slugify(input: string) {
  const s = input
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    // remove quotes
    .replace(/['"]/g, "")
    // turn spaces/underscores into hyphen
    .replace(/[\s_]+/g, "-")
    // remove anything that's NOT letter/number/hyphen (unicode-safe)
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim hyphens
    .replace(/^-+|-+$/g, "");

  return s;
}