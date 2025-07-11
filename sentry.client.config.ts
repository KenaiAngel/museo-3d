import * as Sentry from "@sentry/nextjs";
import { Replay } from "@sentry/replay";

Sentry.init({
  dsn: "https://4f04ee5774499318d4fa964d064482f1@o4509636939218944.ingest.us.sentry.io/4509636940529664",
  integrations: [Sentry.browserTracingIntegration(), new Replay()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1, // 10% de sesiones grabadas
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones con error grabadas
  debug: false,
});
