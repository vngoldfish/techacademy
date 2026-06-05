import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

const { handlers, signIn, signOut, auth: originalAuth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        if (user.isLocked) return null;
        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Set original user details from the decrypted JWT token
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        session.user.impersonated = false;
        session.user.originalId = token.id as string;
        session.user.originalRole = token.role as string;
      }
      return session;
    },
  },
});

export { handlers, signIn, signOut };

export const auth = (...args: any[]) => {
  if (args.length > 0 && typeof args[0] === "function") {
    // Acting as middleware, delegate to original auth function
    return (originalAuth as any)(...args);
  }
  
  return (async () => {
    const session = await (originalAuth as any)(...args);
    if (session?.user) {
      // Resolve user from database using email in Node.js runtime (not Edge)
      if (typeof (globalThis as any).EdgeRuntime === "undefined" && session.user.email) {
        try {
          let lookupEmail = session.user.email as string;
          if (lookupEmail.endsWith("@techacademy.vn")) {
            lookupEmail = lookupEmail.replace("@techacademy.vn", "@bawuiacademy.vn");
          }
          const dbUser = await prisma.user.findUnique({
            where: { email: lookupEmail },
            select: { id: true, role: true, name: true, avatarUrl: true, email: true }
          });
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.email = dbUser.email;
            if (dbUser.name) session.user.name = dbUser.name;
            if (dbUser.avatarUrl) session.user.image = dbUser.avatarUrl;
            
            // Check if impersonation cookie is set (only for ADMIN users)
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const impersonateUserData = cookieStore.get("impersonate_user_data")?.value;
            
            if (impersonateUserData && (dbUser.role === 'ADMIN')) {
              try {
                const targetUser = JSON.parse(impersonateUserData);
                if (targetUser && targetUser.email) {
                  let activeEmail = targetUser.email;
                  if (activeEmail.endsWith("@techacademy.vn")) {
                    activeEmail = activeEmail.replace("@techacademy.vn", "@bawuiacademy.vn");
                  }
                  const dbTargetUser = await prisma.user.findUnique({
                    where: { email: activeEmail },
                    select: { id: true, role: true, name: true, avatarUrl: true }
                  });
                  if (dbTargetUser) {
                    session.user.id = dbTargetUser.id;
                    session.user.role = dbTargetUser.role;
                    if (dbTargetUser.name) session.user.name = dbTargetUser.name;
                    if (dbTargetUser.avatarUrl) session.user.image = dbTargetUser.avatarUrl;
                    session.user.email = activeEmail;
                    session.user.impersonated = true;
                  }
                }
              } catch {
                // ignore parsing errors
              }
            } else {
              session.user.impersonated = false;
              session.user.originalId = dbUser.id;
              session.user.originalRole = dbUser.role;
            }
          }
        } catch (err) {
          console.error("Error resolving original user by email in wrapped auth:", err);
        }
      }
    }
    return session;
  })();
};

