import { sendEmail } from "../usuarios/email/[email]/route";

export async function POST(req) {
  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({
          error: "Faltan campos requeridos: to, subject, html",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const data = await sendEmail({ to, subject, html });
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
