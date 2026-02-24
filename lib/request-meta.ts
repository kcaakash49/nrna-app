export function getRequestMeta(req: Request) {
  const userAgent = req.headers.get("user-agent");
  const xff = req.headers.get("x-forwarded-for");
  const ipAddress = xff ? xff.split(",")[0].trim() : null;

  return { ipAddress, userAgent };
}