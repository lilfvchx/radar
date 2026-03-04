import { useState } from 'react';
import { Camera } from 'lucide-react';
import clsx from 'clsx';

type WebcamRegion = 'iran' | 'middle-east' | 'europe' | 'asia' | 'americas';

interface WebcamFeed {
    id: string;
    city: string;
    country: string;
    region: WebcamRegion;
    fallbackVideoId: string;
}

const WEBCAM_FEEDS: WebcamFeed[] = [
    { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', region: 'europe', fallbackVideoId: '-Q7FuPINDjA' },
    { id: 'iran-tehran', city: 'Tehran', country: 'Iran', region: 'iran', fallbackVideoId: '-zGuR1qVKrU' },
    { id: 'iran-telaviv', city: 'Tel Aviv', country: 'Israel', region: 'iran', fallbackVideoId: 'gmtlJ_m2r5A' },
    { id: 'london', city: 'London', country: 'UK', region: 'europe', fallbackVideoId: 'Lxqcg1qt0XU' },
    { id: 'washington', city: 'Washington DC', country: 'USA', region: 'americas', fallbackVideoId: '1wV9lLe14aU' },
    { id: 'taipei', city: 'Taipei', country: 'Taiwan', region: 'asia', fallbackVideoId: 'z_fY1pj1VBw' },
];

export function LiveWebcamsPanel() {
    const [activeFeed, setActiveFeed] = useState<WebcamFeed>(WEBCAM_FEEDS[0]!);

    return (
        <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-intel-text-light tech-panel-header pb-2">
                <div className="flex items-center gap-2">
                    <Camera size={14} className="text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)]" />
                    <span>Global Surveillance</span>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="text-intel-text truncate max-w-[120px] text-right">{activeFeed.city}, {activeFeed.country}</span>
                    <span className="w-1.5 h-1.5 bg-red-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)] ml-1"></span>
                </div>
            </div>

            <div className="flex-1 bg-black relative overflow-hidden border border-intel-accent/20 border-t-intel-accent/50 drop-shadow-[0_0_8px_rgba(0,229,255,0.05)]">
                <iframe
                    className="w-full h-full absolute inset-0 mix-blend-screen"
                    src={`https://www.youtube-nocookie.com/embed/${activeFeed.fallbackVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`}
                    title={`${activeFeed.city} live webcam`}
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
                {/* Tech overlay over webcam feed */}
                <div className="absolute inset-0 pointer-events-none border-[0.5px] border-intel-accent/10 grid grid-cols-4 grid-rows-4">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-intel-accent/10"></div>
                    ))}
                </div>
            </div>

            <div className="h-20 bg-intel-bg/60 border border-intel-accent/20 flex gap-2 p-1.5 overflow-x-auto custom-scrollbar">
                {WEBCAM_FEEDS.map(feed => (
                    <button
                        key={feed.id}
                        onClick={() => setActiveFeed(feed)}
                        className={clsx(
                            "min-w-[120px] relative flex flex-col justify-end p-2 border transition-all text-left flex-shrink-0 group overflow-hidden",
                            activeFeed.id === feed.id ? 'border-intel-accent drop-shadow-[0_0_5px_var(--color-intel-accent)]' : 'border-intel-accent/20 hover:border-intel-accent/50 filter grayscale hover:grayscale-0'
                        )}
                        style={{
                            backgroundImage: `url(https://img.youtube.com/vi/${feed.fallbackVideoId}/mqdefault.jpg)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className={clsx(
                            "absolute inset-0 transition-opacity",
                            activeFeed.id === feed.id ? 'bg-gradient-to-t from-intel-accent/80 via-black/50 to-transparent mix-blend-multiply' : 'bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:to-transparent'
                        )}></div>

                        <span className={clsx(
                            "relative z-10 text-[10px] font-mono font-bold truncate tracking-wider",
                            activeFeed.id === feed.id ? 'text-white' : 'text-intel-text-light'
                        )}>
                            {feed.city.toUpperCase()}
                        </span>

                        {activeFeed.id === feed.id && (
                            <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-intel-accent shadow-[0_0_8px_var(--color-intel-accent)]"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
