import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    ownerSubject?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    ownerSubject?: string;
  }
}
