import Link from "next/link";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.ownerSubject) redirect("/responsavel");
  return (
    <main className="shell auth-shell">
      <Link className="back" href="/">← Início</Link>
      <section className="panel auth-card stack-lg">
        <div><span className="eyebrow">Área do responsável</span><h1>Entrar</h1><p className="muted">O login é usado apenas para proteger e separar a biblioteca da família.</p></div>
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/responsavel" }); }}>
          <button className="button full" type="submit">Entrar com Google</button>
        </form>
      </section>
    </main>
  );
}
