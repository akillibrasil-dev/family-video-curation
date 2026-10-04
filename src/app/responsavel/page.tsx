import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { requireOwner } from "@/lib/auth-guard";
import { getDashboardStats, getOrCreateFamily } from "@/lib/library";
import { YouTubeReview } from "@/components/youtube-review";

export default async function ParentPage() {
  const owner = await requireOwner();
  if (!owner) redirect("/entrar");
  const family = await getOrCreateFamily(owner.ownerSubject, owner.name);
  const stats = await getDashboardStats(owner.ownerSubject, family.profileId);
  return (
    <main className="shell stack-xl">
      <header className="topbar">
        <div><Link className="back" href="/">← Início</Link><h1>Painel do responsável</h1><p className="muted">Curadoria antes de distribuição.</p></div>
        <div className="top-actions"><Link className="profile-chip" href="/crianca">Abrir · {family.profileName}</Link><form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="link-button" type="submit">Sair</button></form></div>
      </header>
      <section className="stats-grid"><article><strong>{stats.videos}</strong><span>vídeos aprovados</span></article><article><strong>{stats.categories}</strong><span>categorias</span></article><article><strong>{stats.requests}</strong><span>pedidos pendentes</span></article></section>
      <YouTubeReview profileId={family.profileId} />
      <section className="panel"><span className="eyebrow">Regras do MVP</span><h2>O que fica fora do alcance da criança</h2><div className="rule-grid"><div>⛔ Busca pública do YouTube</div><div>⛔ Shorts</div><div>⛔ Feed de tendências</div><div>⛔ Recomendações da aplicação</div></div></section>
    </main>
  );
}
