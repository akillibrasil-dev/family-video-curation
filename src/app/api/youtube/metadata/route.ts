import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeVideoId } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("url") ?? request.nextUrl.searchParams.get("id") ?? "";
  const videoId = extractYouTubeVideoId(input);

  if (!videoId) {
    return NextResponse.json({ error: "URL ou ID do YouTube inválido." }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        demo: true,
        video: {
          youtubeId: videoId,
          title: "Vídeo aguardando consulta à YouTube Data API",
          channel: "Canal não consultado",
          description: "Configure YOUTUBE_API_KEY para obter os metadados reais.",
          duration: null,
          embeddable: null,
          madeForKids: null,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        },
      },
      { status: 200 },
    );
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails,status",
    id: videoId,
    key: apiKey,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Falha ao consultar o YouTube." }, { status: 502 });
  }

  const data = await response.json();
  const item = data.items?.[0];
  if (!item) {
    return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    demo: false,
    video: {
      youtubeId: item.id,
      title: item.snippet?.title ?? "Sem título",
      channel: item.snippet?.channelTitle ?? "Canal desconhecido",
      description: item.snippet?.description ?? "",
      duration: item.contentDetails?.duration ?? null,
      embeddable: item.status?.embeddable ?? null,
      madeForKids: item.status?.madeForKids ?? null,
      thumbnail:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        null,
    },
  });
}
