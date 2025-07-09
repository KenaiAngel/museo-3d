import { prisma } from "../../../lib/prisma";

export async function GET() {
  let dbStatus = "OK";
  let dbLatency = null;
  let userCount = null;
  let muralCount = null;
  const dbStart = Date.now();
  try {
    // Simple DB query and latency
    await prisma.user.findFirst({ select: { id: true } });
    dbLatency = Date.now() - dbStart;
    // Example extra metrics
    userCount = await prisma.user.count();
    muralCount = (await prisma.mural) ? await prisma.mural.count() : null;
  } catch (e) {
    dbStatus = "Error";
    dbLatency = null;
  }
  return Response.json({
    api: "OK",
    db: dbStatus,
    dbLatency,
    userCount,
    muralCount,
    timestamp: new Date().toISOString(),
  });
}
