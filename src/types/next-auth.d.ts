import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      impersonated?: boolean;
      originalId?: string;
      originalRole?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    impersonated?: boolean;
    originalId?: string;
    originalRole?: string;
  }
}
