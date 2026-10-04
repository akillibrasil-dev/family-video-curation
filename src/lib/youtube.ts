export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      const queryId = url.searchParams.get("v");
      if (queryId && /^[A-Za-z0-9_-]{11}$/.test(queryId)) return queryId;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
      const id = embedIndex >= 0 ? parts[embedIndex + 1] : null;
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}
