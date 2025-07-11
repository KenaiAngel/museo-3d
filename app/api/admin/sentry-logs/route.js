import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
    });
  }

  const SENTRY_TOKEN = process.env.SENTRY_TOKEN;
  const SENTRY_ORG = process.env.SENTRY_ORG;
  const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

  if (!SENTRY_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
    return new Response(
      JSON.stringify({ error: "Faltan variables de entorno de Sentry" }),
      { status: 500 }
    );
  }

  const url = `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/events/`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "Error al consultar Sentry" }),
      { status: 500 }
    );
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: 200 });
}
