import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { db, hasDatabase } from "@/lib/db";

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ demo: true, ok: true });

  const body = await request.json();
  const { profileId, video, category, tags } = body ?? {};
  if (!profileId || !video?.youtubeId || !video?.title) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const sql = db();
  const allowed = await sql`
    select 1 from child_profiles cp
    join families f on f.id = cp.family_id
    where cp.id = ${profileId} and f.owner_subject = ${owner.ownerSubject}
    limit 1
  `;
  if (!allowed.length) return NextResponse.json({ error: "Perfil inválido." }, { status: 403 });

  const videos = await sql`
    insert into videos (
      youtube_id, title, channel, description, duration_iso,
      thumbnail_url, embeddable, made_for_kids, updated_at
    ) values (
      ${video.youtubeId}, ${video.title}, ${video.channel ?? "Canal desconhecido"},
      ${video.description ?? ""}, ${video.duration ?? null}, ${video.thumbnail ?? null},
      ${video.embeddable ?? null}, ${video.madeForKids ?? null}, now()
    )
    on conflict (youtube_id) do update set
      title = excluded.title,
      channel = excluded.channel,
      description = excluded.description,
      duration_iso = excluded.duration_iso,
      thumbnail_url = excluded.thumbnail_url,
      embeddable = excluded.embeddable,
      made_for_kids = excluded.made_for_kids,
      updated_at = now()
    returning id
  `;
  const videoId = videos[0].id as string;
  const cleanTags = Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 12)
    : [];
  const tagCsv = cleanTags.join(",");
  await sql`
    insert into profile_videos (profile_id, video_id, category, tags)
    values (${profileId}, ${videoId}, ${String(category || "Geral").trim()},
      case when ${tagCsv} = '' then '{}'::text[] else string_to_array(${tagCsv}, ',') end)
    on conflict (profile_id, video_id) do update set
      category = excluded.category,
      tags = excluded.tags,
      approved_at = now()
  `;
  return NextResponse.json({ ok: true });
}
