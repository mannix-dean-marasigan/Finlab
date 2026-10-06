import { describe, expect, it } from 'vitest';
import { youTubeId } from './YouTubeEmbed';

describe('youTubeId', () => {
  it('parses common YouTube URL shapes', () => {
    expect(youTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youTubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x')).toBe('dQw4w9WgXcQ');
  });
  it('rejects non-YouTube or malformed links', () => {
    expect(youTubeId('https://vimeo.com/123')).toBeNull();
    expect(youTubeId('not a url')).toBeNull();
    expect(youTubeId('https://evil.com/watch?v=abc')).toBeNull();
    expect(youTubeId(null)).toBeNull();
  });
});
