import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientLayout from "../components/ClientLayout";
import AppProviders from "../components/AppProviders";
import SentryTracker from "../components/SentryTracker";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

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

export const metadata = {
  title: "Museo 3D - Arte Urbano",
  description: "Explora el arte urbano en una experiencia inmersiva 3D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} antialiased`}
      >
        <AppProviders>
          <SentryTracker />
          <ClientLayout>{children}</ClientLayout>
        </AppProviders>
        <Toaster
          position="top-center"
          reverseOrder={true}
          limit={1}
          toastOptions={{
            className: "toast-badge",
            duration: 3500,
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
