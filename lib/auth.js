import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SentryLogger } from "./sentryLogger";

console.log("🔧 Loading NextAuth configuration...");

// Verificar variables de entorno
console.log("🔍 Environment variables check:");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log(
  "NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Not set"
);
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set"
);
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set"
);

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Permite vincular cuentas automáticamente
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/", // Puedes personalizar la ruta de login
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 SignIn callback:", {
        user: user.email,
        provider: account?.provider,
      });

      // Para usuarios de Google, manejar tanto usuarios nuevos como existentes
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
              accounts: true,
            },
          });

          if (existingUser) {
            // Usuario existe, verificar si ya tiene una cuenta de Google
            const googleAccount = existingUser.accounts.find(
              (acc) => acc.provider === "google"
            );

            if (!googleAccount) {
              // Usuario existe pero no tiene cuenta de Google, vincular automáticamente
              console.log(
                "🔗 Linking Google account to existing user:",
                user.email
              );
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  id_token: account.id_token,
                  refresh_token: account.refresh_token,
                  scope: account.scope,
                  session_state: account.session_state,
                  token_type: account.token_type,
                },
              });

              // Actualizar información del usuario con datos de Google si están disponibles
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  emailVerified: new Date(),
                },
              });
            }
          } else {
            // Usuario no existe, crear uno nuevo
            console.log("👤 Creating new user from Google:", user.email);
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Error en signIn de Google:", error);
          return false; // Evita el inicio de sesión si hay un error
        }
      }
      return true; // Permitir el inicio de sesión
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.role) {
        session.user.role = token.role;
      }
      if (token?.name) {
        session.user.name = token.name;
      }
      if (token?.picture) {
        session.user.image = token.picture;
      }
      if (token?.emailVerified) {
        session.user.emailVerified = token.emailVerified;
      }

      // Log de inicio de sesión exitoso
      if (session.user?.id && session.user?.email) {
        SentryLogger.userLogin(session.user.id, session.user.email, "session");
      }

      return session;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      // Siempre refrescar el rol y emailVerified desde la base de datos
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, email: true, id: true, emailVerified: true },
        });
        console.log("🔍 JWT callback DB user:", dbUser);
        if (dbUser) {
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      // Soporte para actualización de sesión (ej. update de perfil)
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
        if (token.sub) {
          await prisma.user.update({
            where: { id: token.sub },
            data: {
              name: session.name,
              image: session.image,
            },
          });
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signIn(message) {
      console.log("✅ User signed in:", message.user?.email);
    },
    async signOut(message) {
      console.log("👋 User signed out:", message.token?.email || "unknown");
    },
    async createUser(message) {
      console.log("👤 New user created:", message.user?.email);
    },
    async session(message) {
      console.log("📱 Session active:", message.session?.user?.email);
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("❌ NextAuth Error:", code, metadata);

      // Manejar específicamente el error OAuthAccountNotLinked
      if (code === "OAuthAccountNotLinked") {
        console.log("🔗 Attempting to handle OAuthAccountNotLinked error");
        // El error ya debe estar resuelto por allowDangerousEmailAccountLinking
        // y el callback de signIn personalizado
      }
    },
    warn(code) {
      console.warn("⚠️ NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.log("🐛 NextAuth Debug:", code, metadata);
    },
  },
};
