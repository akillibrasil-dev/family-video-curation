import { auth } from "@/auth";

export async function requireOwner() {
  const session = await auth();
  if (!session?.ownerSubject) return null;
  return {
    ownerSubject: session.ownerSubject,
    name: session.user?.name ?? "Responsável",
    email: session.user?.email ?? null
  };
}
