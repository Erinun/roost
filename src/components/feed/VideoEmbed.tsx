import { extractVideoInfo } from '@/lib/videoUrl';

interface VideoEmbedProps {
    url: string;
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
    const embedUrl = extractVideoInfo(url)?.embedUrl ?? null;

    if (!embedUrl) return null;

    return (
        <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-surface-200 bg-black shadow-sm">
            <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Inbäddad video"
            />
        </div>
    );
}

/**
 * Helper to detect video links in text
 */
export function detectVideoLinks(text: string): string[] {
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?[a-zA-Z0-9_-]{11}(?:\S+)?/g;
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/[0-9]+(?:\S+)?/g;

    const matches = [...(text.match(ytRegex) || []), ...(text.match(vimeoRegex) || [])];

    // Return unique matches
    return Array.from(new Set(matches));
}
