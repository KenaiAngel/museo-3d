import {
  Geist,
  Geist_Mono,
  Inter,
  Playfair_Display,
  Monoton,
} from "next/font/google";
import "./globals.css";
import ClientLayout from "../components/ClientLayout";
import AppProviders from "../components/AppProviders";
import SentryTracker from "../components/SentryTracker";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { PushNotificationsProvider } from "./components/PushNotificationsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const monoton = Monoton({
  variable: "--font-monoton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Museo 3D - Arte Urbano",
  description: "Explora el arte urbano en una experiencia inmersiva 3D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} ${monoton.variable} antialiased`}
      >
        <PushNotificationsProvider>
          <AppProviders>
            <SentryTracker />
            <ClientLayout>{children}</ClientLayout>
          </AppProviders>
        </PushNotificationsProvider>
        <Toaster
          position="top-center"
          reverseOrder={true}
          limit={2}
          containerStyle={{
            top: "25%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translateX(-50%)",
          }}
          toastOptions={{
            className: "toast-badge",
            duration: 4000,
            success: {
              className: "toast-badge toast-badge-success",
              icon: <span className="toast-animated-icon">✅</span>,
            },
            error: {
              className: "toast-badge toast-badge-error",
              icon: <span className="toast-animated-icon">❌</span>,
            },
            info: {
              className: "toast-badge toast-badge-info",
              icon: <span className="toast-animated-icon">ℹ️</span>,
            },
          }}
        />
      </body>
    </html>
  );
}
