import { db, hasDatabase } from "@/lib/db";
import { demoVideos } from "@/lib/demo-data";

export type LibraryVideo = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  category: string;
  tags: string[];
  duration: string;
  thumbnail: string | null;
};

export async function getOrCreateFamily(ownerSubject: string, displayName = "Minha família") {
  if (!hasDatabase()) {
    return { familyId: "demo-family", profileId: "demo-profile", profileName: "Perfil infantil" };
  }
  const sql = db();
  const families = await sql`
    insert into families (owner_subject, display_name)
    values (${ownerSubject}, ${displayName})
    on conflict (owner_subject) do update set display_name = excluded.display_name
    returning id, display_name
  `;
  const family = families[0] as { id: string; display_name: string };
  const profiles = await sql`
    select id, name from child_profiles
    where family_id = ${family.id} and is_active = true
    order by created_at asc limit 1
  `;
  if (profiles[0]) {
    return { familyId: family.id, profileId: profiles[0].id as string, profileName: profiles[0].name as string };
  }
  const created = await sql`
    insert into child_profiles (family_id, name)
    values (${family.id}, 'Perfil infantil')
    returning id, name
  `;
  return { familyId: family.id, profileId: created[0].id as string, profileName: created[0].name as string };
}

export async function getLibrary(ownerSubject: string, profileId: string): Promise<LibraryVideo[]> {
  if (!hasDatabase()) {
    return demoVideos.map((video) => ({
      id: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      channel: video.channel,
      category: video.category,
      tags: video.tags,
      duration: video.duration,
      thumbnail: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
    }));
  }
  const sql = db();
  const rows = await sql`
    select
      v.id, v.youtube_id, v.title, v.channel, v.duration_iso, v.thumbnail_url,
      pv.category, pv.tags
    from profile_videos pv
    join child_profiles cp on cp.id = pv.profile_id
    join families f on f.id = cp.family_id
    join videos v on v.id = pv.video_id
    where f.owner_subject = ${ownerSubject}
      and cp.id = ${profileId}
      and cp.is_active = true
    order by pv.approved_at desc
  `;
  return rows.map((row) => ({
    id: row.id as string,
    youtubeId: row.youtube_id as string,
    title: row.title as string,
    channel: row.channel as string,
    category: (row.category as string) || "Geral",
    tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    duration: (row.duration_iso as string) || "",
    thumbnail: (row.thumbnail_url as string | null) ?? null
  }));
}

export async function canPlay(ownerSubject: string, profileId: string, youtubeId: string) {
  if (!hasDatabase()) return demoVideos.some((video) => video.youtubeId === youtubeId);
  const sql = db();
  const rows = await sql`
    select 1
    from profile_videos pv
    join child_profiles cp on cp.id = pv.profile_id
    join families f on f.id = cp.family_id
    join videos v on v.id = pv.video_id
    where f.owner_subject = ${ownerSubject}
      and cp.id = ${profileId}
      and v.youtube_id = ${youtubeId}
    limit 1
  `;
  return rows.length > 0;
}

export async function getDashboardStats(ownerSubject: string, profileId: string) {
  if (!hasDatabase()) return { videos: 3, categories: 3, requests: 0 };
  const sql = db();
  const rows = await sql`
    select
      count(distinct pv.video_id)::int as videos,
      count(distinct pv.category)::int as categories,
      (select count(*)::int
       from content_requests cr
       join child_profiles cp2 on cp2.id = cr.profile_id
       join families f2 on f2.id = cp2.family_id
       where f2.owner_subject = ${ownerSubject} and cr.status = 'pending') as requests
    from profile_videos pv
    join child_profiles cp on cp.id = pv.profile_id
    join families f on f.id = cp.family_id
    where f.owner_subject = ${ownerSubject} and cp.id = ${profileId}
  `;
  return {
    videos: Number(rows[0]?.videos ?? 0),
    categories: Number(rows[0]?.categories ?? 0),
    requests: Number(rows[0]?.requests ?? 0)
  };
}
