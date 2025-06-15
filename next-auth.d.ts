// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
    
  }

  interface User {
    _id: string;
    userName: string;
    fullName: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    userName: string;
    fullName: string;
    email: string;
  }
}
