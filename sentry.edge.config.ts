// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://4f04ee5774499318d4fa964d064482f1@o4509636939218944.ingest.us.sentry.io/4509636940529664",
  tracesSampleRate: 1.0,
  debug: false,
});
