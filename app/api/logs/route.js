export async function GET(req) {
  return new Response(JSON.stringify({ error: "Endpoint no implementado" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}
