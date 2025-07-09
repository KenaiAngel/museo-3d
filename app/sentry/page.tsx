"use client";

import Head from "next/head";
import * as Sentry from "@sentry/nextjs";
import { useState, useEffect } from "react";

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export default function Page() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== "sentry-unreachable");
    }
    checkConnectivity();
  }, []);

  return (
    <div>
      <Head>
        <title>sentry-example-page</title>
        <meta name="description" content="Test Sentry for your Next.js app!" />
      </Head>

      <main>
        <div className="flex-spacer" />
        <svg
          height="40"
          width="40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21.85 2.995a3.698 3.698 0 0 1 1.353 1.354l16.303 28.278a3.703 3.703 0 0 1-1.354 5.053 3.694 3.694 0 0 1-1.848.496h-3.828a31.149 31.149 0 0 0 0-3.09h3.815a.61.61 0 0 0 .537-.917L20.523 5.893a.61.61 0 0 0-1.057 0l-3.739 6.494a28.948 28.948 0 0 1 9.63 10.453 28.988 28.988 0 0 1 3.499 13.78v1.542h-9.852v-1.544a19.106 19.106 0 0 0-2.182-8.85 19.08 19.08 0 0 0-6.032-6.829l-1.85 3.208a15.377 15.377 0 0 1 6.382 12.484v1.542H3.696A3.694 3.694 0 0 1 0 34.473c0-.648.17-1.286.494-1.849l2.33-4.074a8.562 8.562 0 0 1 2.689 1.536L3.158 34.17a.611.611 0 0 0 .538.917h8.448a12.481 12.481 0 0 0-6.037-9.09l-1.344-.772 4.908-8.545 1.344.77a22.16 22.16 0 0 1 7.705 7.444 22.193 22.193 0 0 1 3.316 10.193h3.699a25.892 25.892 0 0 0-3.811-12.033 25.856 25.856 0 0 0-9.046-8.796l-1.344-.772 5.269-9.136a3.698 3.698 0 0 1 3.2-1.849c.648 0 1.285.17 1.847.495Z"
            fill="currentcolor"
          />
        </svg>
        <h1>Página de ejemplo de Sentry</h1>

        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 8,
            padding: 16,
            margin: "24px 0",
            fontSize: 17,
            color: "#374151",
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <b>¿Por qué es importante Sentry?</b>
          <br />
          Sentry es una herramienta que nos ayuda a detectar, monitorear y
          solucionar errores en tiempo real. Gracias a Sentry, el equipo técnico
          puede identificar rápidamente los problemas, entender su causa y
          mejorar la experiencia para todos los usuarios. ¡Tu visita y reporte
          ayudan a que el museo digital sea cada vez mejor!
        </div>

        <p className="description">
          Haz clic en el botón de abajo para generar un error de prueba y verlo
          reportado en Sentry (
          <a
            target="_blank"
            href="https://takito.sentry.io/issues/?project=4509636940529664"
          >
            ver issues
          </a>
          ).
        </p>

        <button
          type="button"
          onClick={async () => {
            await Sentry.startSpan(
              {
                name: "Example Frontend/Backend Span",
                op: "test",
              },
              async () => {
                const res = await fetch("/api/sentry-example-api");
                if (!res.ok) {
                  setHasSentError(true);
                }
              }
            );
            throw new SentryExampleFrontendError(
              "Este error es generado en el frontend de la página de ejemplo."
            );
          }}
          disabled={!isConnected}
        >
          <span>Generar error de prueba</span>
        </button>

        {hasSentError ? (
          <p className="success">Error enviado a Sentry correctamente.</p>
        ) : !isConnected ? (
          <div className="connectivity-error">
            <p>
              No se puede conectar con Sentry. Verifica tu conexión o desactiva
              el bloqueador de anuncios.
            </p>
          </div>
        ) : (
          <div className="success_placeholder" />
        )}

        {/* Ejemplo funcional adicional: Captura manual de excepción */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            Ejemplo: Captura manual de error
          </h2>
          <button
            type="button"
            onClick={() => {
              try {
                throw new Error("Error manual para demostración");
              } catch (e) {
                Sentry.captureException(e);
                alert("Error capturado y enviado a Sentry");
              }
            }}
            style={{
              background: "#553DB8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Capturar error manualmente
          </button>
        </div>

        <div className="flex-spacer" />
      </main>

      <style>{`
        main {
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        }

        h1 {
          padding: 0px 4px;
          border-radius: 4px;
          background-color: rgba(24, 20, 35, 0.03);
          font-family: monospace;
          font-size: 20px;
          line-height: 1.2;
        }

        p {
          margin: 0;
          font-size: 20px;
        }

      

        .description {
          text-align: center;
          color: #6E6C75;
          max-width: 500px;
          line-height: 1.5;
          font-size: 20px;

          @media (prefers-color-scheme: dark) {
            color: #A49FB5;
          }
        }

        .flex-spacer {
          flex: 1;
        }

        .success {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 20px;
          line-height: 1;
          background-color: #00F261;
          border: 1px solid #00BF4D;
          color: #181423;
        }

        .success_placeholder {
          height: 46px;
        }

        .connectivity-error {
          padding: 12px 16px;
          background-color: #E50045;
          border-radius: 8px;
          width: 500px;
          color: #FFFFFF;
          border: 1px solid #A80033;
          text-align: center;
          margin: 0;
        }
        
        .connectivity-error a {
          color: #FFFFFF;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
