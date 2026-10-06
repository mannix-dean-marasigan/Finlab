/** Extracts the video id from common YouTube URL shapes. */
export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

/** Privacy-enhanced YouTube player (youtube-nocookie.com), 16:9. */
export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = youTubeId(url);
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
