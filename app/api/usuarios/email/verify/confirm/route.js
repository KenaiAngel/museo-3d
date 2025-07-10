import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token)
    return Response.redirect("/api/usuarios/email/verify/invalid", 302);

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: { gt: new Date() },
    },
  });

  if (!user)
    return Response.redirect("/api/usuarios/email/verify/invalid", 302);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  // Redirige a la página de éxito
  return Response.redirect("/api/usuarios/email/verify/success", 302);
}
