import { prisma } from "@/lib/prisma";

export async function POST(req, { params }) {
  const { id } = params;
  if (!id) return new Response("ID requerido", { status: 400 });

  await prisma.user.update({
    where: { id },
    data: { emailVerified: null },
  });

  return new Response("Email invalidado", { status: 200 });
}
