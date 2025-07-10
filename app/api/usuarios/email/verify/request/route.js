import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = new PrismaClient();

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return new Response("Email requerido", { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { email },
    data: {
      verificationToken: token,
      verificationTokenExpires: expires,
    },
  });

  const { origin } = new URL(req.url);
  const verifyUrl = `${origin}/usuarios/email/verify/confirm?token=${token}`;

  await resend.emails.send({
    from: "Museo 3D <info@psicologopuebla.com>",
    to: email,
    subject: "Verifica tu correo electrónico",
    html: `<p>Haz clic en el siguiente enlace para verificar tu correo:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
  });

  return new Response("Email de verificación enviado", { status: 200 });
}
