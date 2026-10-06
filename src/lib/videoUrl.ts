export type VideoPlatform = 'youtube' | 'vimeo';

export interface VideoInfo {
    platform: VideoPlatform;
    videoId: string;
    thumbnailUrl: string;
    embedUrl: string;
}

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID = /^[0-9]+$/;

// Path-segment som följs av ett video-ID på youtube.com
const YOUTUBE_PATH_PREFIXES = ['shorts', 'live', 'embed', 'v'];

function youtubeInfo(videoId: string): VideoInfo {
    return {
        platform: 'youtube',
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
}

function vimeoInfo(videoId: string): VideoInfo {
    return {
        platform: 'vimeo',
        videoId,
        thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
}

/**
 * Tolkar en video-URL och returnerar plattform, video-ID, miniatyr- och embed-URL.
 * Stödjer YouTube (watch, youtu.be, shorts, live, embed, mobil) och Vimeo
 * (vanliga länkar samt player.vimeo.com). Returnerar null för allt annat.
 */
export function extractVideoInfo(url: string): VideoInfo | null {
    const trimmed = url.trim();
    if (!trimmed) return null;

    let parsed: URL;
    try {
        parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    } catch {
        return null;
    }

    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (host === 'youtu.be') {
        const id = segments[0] || '';
        return YOUTUBE_ID.test(id) ? youtubeInfo(id) : null;
    }

    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v && YOUTUBE_ID.test(v)) return youtubeInfo(v);

        if (
            segments.length === 2 &&
            YOUTUBE_PATH_PREFIXES.includes(segments[0]) &&
            YOUTUBE_ID.test(segments[1])
        ) {
            return youtubeInfo(segments[1]);
        }
        return null;
    }

    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
        const id = segments[segments.length - 1] || '';
        return VIMEO_ID.test(id) ? vimeoInfo(id) : null;
    }

    return null;
}
