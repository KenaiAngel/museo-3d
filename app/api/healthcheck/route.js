import { prisma } from "../../../lib/prisma";
import { SentryLogger } from "../../../lib/sentryLogger";

const startTime = Date.now();

export async function GET() {
  let dbStatus = "OK";
  let dbLatency = null;
  let userCount = null;
  let muralCount = null;
  let roomCount = null;
  let activeSessionsCount = null;

  const dbStart = Date.now();
  try {
    // Simple DB query and latency
    await prisma.user.findFirst({ select: { id: true } });
    dbLatency = Date.now() - dbStart;

    // Métricas de contenido
    userCount = await prisma.user.count();
    muralCount = (await prisma.mural?.count()) || 0;

    // Verificar si existe la tabla de salas
    try {
      roomCount = (await prisma.sala?.count()) || 0;
    } catch (e) {
      roomCount = 0;
    }

    // Sesiones activas (usuarios con última actividad en las últimas 24 horas)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      activeSessionsCount = await prisma.user.count({
        where: {
          updatedAt: {
            gte: twentyFourHoursAgo,
          },
        },
      });
    } catch (e) {
      activeSessionsCount = 0;
    }
  } catch (e) {
    dbStatus = "Error";
    dbLatency = null;
  }

  // Información del sistema
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  const version = process.env.npm_package_version || "1.0.0";

  // Log métricas importantes en Sentry
  if (dbLatency && dbLatency > 1000) {
    SentryLogger.slowQuery("healthcheck", dbLatency, "/api/healthcheck");
  }

  if (memoryUsage.heapUsed > 100 * 1024 * 1024) {
    // 100MB
    SentryLogger.systemHealth("memory_usage", memoryUsage.heapUsed, "warning");
  }

  // Log estadísticas generales periódicamente
  if (userCount > 0) {
    SentryLogger.systemHealth("user_count", userCount);
  }

  return Response.json({
    api: "OK",
    db: dbStatus,
    dbLatency,
    userCount,
    muralCount,
    roomCount,
    activeSessionsCount,
    uptime,
    memoryUsage,
    version,
    timestamp: new Date().toISOString(),
  });
}
