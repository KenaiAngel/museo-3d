import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({
      from: "info@psicologopuebla.com",
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
