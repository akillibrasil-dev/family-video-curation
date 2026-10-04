import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth-guard";
import { getLibrary, getOrCreateFamily } from "@/lib/library";
import { LibrarySearch } from "@/components/library-search";

export default async function ChildPage() {
  const owner = await requireOwner();
  if (!owner) redirect("/entrar");
  const family = await getOrCreateFamily(owner.ownerSubject, owner.name);
  const videos = await getLibrary(owner.ownerSubject, family.profileId);
  const categories = [...new Set(videos.map((video) => video.category))].slice(0, 6);
  return (
    <main className="shell child-shell stack-xl">
      <header className="child-header"><div><span className="eyebrow">{family.profileName}</span><h1>O que vamos ver?</h1><p>Você só encontra vídeos que já estão na sua biblioteca.</p></div><Link className="parent-exit" href="/responsavel">🔒 Responsável</Link></header>
      <div className="category-row">{categories.map((category) => <span key={category}>✨ {category}</span>)}</div>
      <LibrarySearch videos={videos} profileId={family.profileId} />
    </main>
  );
}
