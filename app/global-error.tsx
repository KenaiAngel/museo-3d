"use client";

import * as Sentry from "@sentry/nextjs";
import ErrorPage from "../components/ErrorPage";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorPage
          error="500"
          title="¡Vaya! Ocurrió un error inesperado"
          message="Algo salió mal en el servidor. Por favor, intenta de nuevo más tarde o vuelve al inicio."
          showHome={true}
        />
      </body>
    </html>
  );
}
