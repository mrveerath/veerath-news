// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
    
  }

  interface User {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    profileImage:string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userName: string;
    fullName: string;
    email: string;
  }
}
