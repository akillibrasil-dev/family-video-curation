"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LibraryVideo } from "@/lib/library";

export function LibrarySearch({ videos, profileId }: { videos: LibraryVideo[]; profileId: string }) {
  const [query, setQuery] = useState("");
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return videos;
    return videos.filter((video) => [video.title, video.channel, video.category, ...video.tags]
      .join(" ").toLowerCase().includes(normalized));
  }, [query, videos]);

  async function requestContent() {
    if (query.trim().length < 2 || sending) return;
    setSending(true);
    const response = await fetch("/api/content-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId, query })
    });
    setSending(false);
    if (response.ok) setRequested(true);
  }

  return (
    <section className="stack-lg">
      <label className="search-box">
        <span>🔎</span>
        <input value={query} onChange={(event) => { setQuery(event.target.value); setRequested(false); }}
          placeholder="Buscar só na minha biblioteca" aria-label="Buscar na biblioteca" />
      </label>

      {results.length > 0 ? (
        <div className="video-grid">
          {results.map((video) => (
            <Link className="video-card" key={video.id}
              href={`/crianca/assistir/${video.youtubeId}?profile=${encodeURIComponent(profileId)}`}>
              <div className="video-thumb">
                <Image src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
                {video.duration && <span>{video.duration}</span>}
              </div>
              <div className="video-body">
                <small>{video.category}</small><h3>{video.title}</h3><p>{video.channel}</p>
                <div className="tag-row">{video.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🪐</div>
          <h2>Ainda não temos vídeos sobre “{query}”.</h2>
          <p>A busca termina aqui: nenhum conteúdo externo do YouTube é mostrado.</p>
          {requested ? <div className="alert success">Pedido enviado ao responsável.</div> :
            <button className="button secondary" type="button" disabled={sending} onClick={requestContent}>
              {sending ? "Enviando…" : "Pedir vídeos sobre este assunto"}
            </button>}
        </div>
      )}
    </section>
  );
}
