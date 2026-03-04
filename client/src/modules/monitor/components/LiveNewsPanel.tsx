import { Tv } from 'lucide-react';

export function LiveNewsPanel() {
    return (
        <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-intel-text-light tech-panel-header pb-2">
                <div className="flex items-center gap-2">
                    <Tv size={14} className="text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)]" />
                    <span>Global Live Feed</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    <span className="text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">LIVE</span>
                </div>
            </div>

            <div className="flex-1 bg-black relative overflow-hidden border border-intel-accent/20 border-t-intel-accent/50 drop-shadow-[0_0_8px_rgba(0,229,255,0.05)]">
                <iframe
                    className="w-full h-full absolute inset-0"
                    src="https://www.youtube-nocookie.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0" // Bloomberg Live or similar
                    title="Live News"
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            <div className="text-[10px] text-intel-text uppercase tracking-widest px-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-intel-accent/50 inline-block"></span>
                Primary Open Source Feed • Bloomberg Global Network
            </div>
        </div>
    );
}
