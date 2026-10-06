import { describe, it, expect } from 'vitest';
import { extractVideoInfo } from './videoUrl';

describe('extractVideoInfo', () => {
    describe('YouTube', () => {
        const expectYouTube = (url: string, videoId: string) => {
            const info = extractVideoInfo(url);
            expect(info).not.toBeNull();
            expect(info!.platform).toBe('youtube');
            expect(info!.videoId).toBe(videoId);
            expect(info!.thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        };

        it('matchar standard watch-URL', () => {
            expectYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar watch-URL utan www och protokoll', () => {
            expectYouTube('youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar watch-URL med extra query-parametrar', () => {
            expectYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLx', 'dQw4w9WgXcQ');
        });

        it('matchar watch-URL där v inte är första parametern', () => {
            expectYouTube('https://www.youtube.com/watch?list=PLx&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar youtu.be-delningslänk', () => {
            expectYouTube('https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar youtu.be-länk med si-parameter', () => {
            expectYouTube('https://youtu.be/dQw4w9WgXcQ?si=AbCdEf123', 'dQw4w9WgXcQ');
        });

        it('matchar shorts-länk', () => {
            expectYouTube('https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar live-länk', () => {
            expectYouTube('https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar embed-länk', () => {
            expectYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });

        it('matchar mobillänk (m.youtube.com)', () => {
            expectYouTube('https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ');
        });
    });

    describe('Vimeo', () => {
        const expectVimeo = (url: string, videoId: string) => {
            const info = extractVideoInfo(url);
            expect(info).not.toBeNull();
            expect(info!.platform).toBe('vimeo');
            expect(info!.videoId).toBe(videoId);
            expect(info!.thumbnailUrl).toBe(`https://vumbnail.com/${videoId}.jpg`);
        };

        it('matchar standard Vimeo-URL', () => {
            expectVimeo('https://vimeo.com/123456789', '123456789');
        });

        it('matchar Vimeo-URL utan protokoll', () => {
            expectVimeo('vimeo.com/123456789', '123456789');
        });

        it('matchar Vimeo-URL med query-parametrar', () => {
            expectVimeo('https://vimeo.com/123456789?share=copy', '123456789');
        });

        it('matchar Vimeo player-URL', () => {
            expectVimeo('https://player.vimeo.com/video/123456789', '123456789');
        });
    });

    describe('ogiltiga URL:er', () => {
        it.each([
            'https://example.com/video',
            'https://www.loom.com/share/abc123',
            'inte en url alls',
            '',
            'https://youtube.com/',
            'https://youtube.com/channel/UCabcdefghijklmnopqrstuv',
        ])('returnerar null för %s', (url) => {
            expect(extractVideoInfo(url)).toBeNull();
        });
    });

    describe('embed-URL', () => {
        it('bygger embed-URL för YouTube', () => {
            const info = extractVideoInfo('https://youtu.be/dQw4w9WgXcQ');
            expect(info!.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
        });

        it('bygger embed-URL för Vimeo', () => {
            const info = extractVideoInfo('https://vimeo.com/123456789');
            expect(info!.embedUrl).toBe('https://player.vimeo.com/video/123456789');
        });
    });
});
