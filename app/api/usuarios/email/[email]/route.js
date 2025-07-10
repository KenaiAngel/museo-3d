import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- INTEGRACIÓN RESEND ---
import { Resend } from "resend";

const resend = new Resend("re_7bBL1GSd_B8i2u8ZwqWRu1HJQ5v385HXW");

export async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@psicologopuebla.com", // Remitente actualizado
      to,
      subject,
      html,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error enviando email con Resend:", err);
    throw err;
  }
}

// Ejemplo de uso (descomentar para probar):
// await sendEmail({
//   to: 'destinatario@ejemplo.com',
//   subject: 'Prueba de Resend',
//   html: '<h1>¡Funciona!</h1><p>Este es un email de prueba enviado con Resend.</p>'
// });

// GET /api/usuarios/email/[email] - Verificar disponibilidad de email
export async function GET(req, context) {
  try {
    const params = await context.params;
    const { email } = params;

    console.log("🔄 GET /api/usuarios/email/[email]: Querying user", { email });

    if (!email) {
      return new Response(
        JSON.stringify({
          error: "Email requerido",
          message: "Debes proporcionar un email para verificar",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Buscar usuario con ese email
    const { searchParams } = new URL(req.url);
    const includePassword = searchParams.get("includePassword") === "true";

    console.log(
      "🔄 GET /api/usuarios/email/[email]: Querying database for email:",
      email
    );

    const usuario = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        settings: true,
        ...(includePassword && { password: true }),
      },
    });

    console.log(
      "📊 GET /api/usuarios/email/[email]: Database result:",
      usuario
    );

    const response = {
      email,
      available: !usuario,
      exists: !!usuario,
      user: usuario || null,
    };

    console.log(
      "📤 GET /api/usuarios/email/[email]: Sending response:",
      response
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ GET /api/usuarios/email/[email]: Error:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor al verificar email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
