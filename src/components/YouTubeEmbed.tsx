import { useEffect, useRef } from 'react';

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

// ---- Minimal typings for the YouTube IFrame Player API ----
interface YTPlayer {
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error('YouTube player failed to load'));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

/**
 * Privacy-enhanced YouTube player (youtube-nocookie.com), 16:9.
 * Calls onEnded when the viewer reaches the end of the video.
 */
export function YouTubeEmbed({ url, title, onEnded }: { url: string; title: string; onEnded?: () => void }) {
  const id = youTubeId(url);
  const host = useRef<HTMLDivElement>(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  const valid = !!id && /^[A-Za-z0-9_-]{6,20}$/.test(id);

  useEffect(() => {
    if (!valid || !host.current) return;
    let player: YTPlayer | null = null;
    let cancelled = false;
    const mount = document.createElement('div');
    host.current.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId: id!,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.ENDED) endedRef.current?.();
            },
          },
        });
      })
      .catch(() => {
        // Fallback: plain embed (manual "mark as watched" still works).
        if (cancelled) return;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
        iframe.title = title;
        iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        mount.replaceWith(iframe);
      });
    const el = host.current;
    return () => {
      cancelled = true;
      player?.destroy();
      el.innerHTML = '';
    };
  }, [id, valid, title]);

  if (!valid) return null;
  return (
    <div
      ref={host}
      title={title}
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black [&>*]:absolute [&>*]:inset-0 [&>*]:h-full [&>*]:w-full"
    />
  );
}
