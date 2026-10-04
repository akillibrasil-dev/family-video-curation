import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth-guard";
import { canPlay, getOrCreateFamily } from "@/lib/library";

export default async function WatchPage({ params, searchParams }: { params: Promise<{ youtubeId: string }>; searchParams: Promise<{ profile?: string }> }) {
  const owner = await requireOwner();
  if (!owner) redirect("/entrar");
  const { youtubeId } = await params;
  const { profile } = await searchParams;
  const family = await getOrCreateFamily(owner.ownerSubject, owner.name);
  const profileId = profile || family.profileId;
  if (!(await canPlay(owner.ownerSubject, profileId, youtubeId))) notFound();
  return (
    <main className="watch-shell">
      <header className="watch-top"><Link href="/crianca">← Minha biblioteca</Link><span>Sem feed · sem busca externa</span></header>
      <div className="player-wrap"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1`} title="Vídeo aprovado" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
    </main>
  );
}
