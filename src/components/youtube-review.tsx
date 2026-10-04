"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

type Metadata = {
  youtubeId: string; title: string; channel: string; description: string;
  duration: string | null; embeddable: boolean | null; madeForKids: boolean | null; thumbnail: string | null;
};

export function YouTubeReview({ profileId }: { profileId: string }) {
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<Metadata | null>(null);
  const [category, setCategory] = useState("Geral");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null); setVideo(null);
    try {
      const response = await fetch(`/api/youtube/metadata?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível consultar o vídeo.");
      setVideo(data.video);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro inesperado."); }
    finally { setLoading(false); }
  }

  async function approve() {
    if (!video || saving) return;
    setSaving(true); setError(null); setMessage(null);
    const response = await fetch("/api/videos/approve", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId, video, category, tags: tags.split(",") })
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error ?? "Falha ao aprovar vídeo.");
    setMessage(data.demo ? "Aprovação simulada: conecte o Neon para persistir." : "Vídeo aprovado e adicionado à biblioteca.");
  }

  return (
    <section className="panel stack-lg">
      <div><span className="eyebrow">Curadoria</span><h2>Adicionar vídeo por URL</h2><p className="muted">A criança nunca usa esta busca externa.</p></div>
      <form className="url-form" onSubmit={submit}>
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Cole uma URL do YouTube" required />
        <button className="button" disabled={loading} type="submit">{loading ? "Consultando…" : "Revisar vídeo"}</button>
      </form>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      {video && (
        <div className="review-card">
          {video.thumbnail && <div className="review-thumb"><Image src={video.thumbnail} alt="" fill sizes="300px" /></div>}
          <div className="stack-sm">
            <span className="eyebrow">Pré-análise</span><h3>{video.title}</h3><p>{video.channel}</p>
            <div className="facts"><span>Incorporável: {video.embeddable === null ? "a consultar" : video.embeddable ? "sim" : "não"}</span><span>Para crianças: {video.madeForKids === null ? "não informado" : video.madeForKids ? "sim" : "não"}</span></div>
            <div className="approval-fields">
              <label>Categoria<input value={category} onChange={(e) => setCategory(e.target.value)} /></label>
              <label>Tags, separadas por vírgula<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ciência, espaço, foguete" /></label>
            </div>
            <div className="actions"><button className="button" type="button" onClick={approve} disabled={saving || video.embeddable === false}>{saving ? "Salvando…" : "Aprovar para o perfil"}</button><button className="button ghost" type="button" onClick={() => setVideo(null)}>Descartar</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
