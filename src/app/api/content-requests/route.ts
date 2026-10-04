import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";
import { db, hasDatabase } from "@/lib/db";

export async function POST(request: Request) {
  const owner = await requireOwner();
  if (!owner) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { profileId, query } = await request.json();
  const clean = String(query ?? "").trim().slice(0, 120);
  if (!profileId || clean.length < 2) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  if (!hasDatabase()) return NextResponse.json({ demo: true, ok: true });
  const sql = db();
  const allowed = await sql`
    select 1 from child_profiles cp
    join families f on f.id = cp.family_id
    where cp.id = ${profileId} and f.owner_subject = ${owner.ownerSubject}
    limit 1
  `;
  if (!allowed.length) return NextResponse.json({ error: "Perfil inválido." }, { status: 403 });
  await sql`insert into content_requests (profile_id, query) values (${profileId}, ${clean})`;
  return NextResponse.json({ ok: true });
}
