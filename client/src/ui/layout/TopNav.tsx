import React from 'react';
import { useThemeStore } from '../theme/theme.store';

export const TopNav: React.FC = () => {
    // Fine-grained selectors — each only re-renders TopNav when its own slice changes.
    const mode = useThemeStore(s => s.mode);
    const setMode = useThemeStore(s => s.setMode);
    const mapProjection = useThemeStore(s => s.mapProjection);
    const setMapProjection = useThemeStore(s => s.setMapProjection);
    const activeModule = useThemeStore(s => s.activeModule);
    const setActiveModule = useThemeStore(s => s.setActiveModule);

    return (
        <header className="h-14 bg-intel-bg border-b border-intel-accent/40 shadow-[0_4px_20px_rgba(0,229,255,0.1)] flex items-center px-6 justify-between z-10 relative box-border">
            {/* Left side: Logo & Module Nav */}
            <div className="flex items-center gap-8 h-full">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-intel-accent animate-pulse shadow-[0_0_8px_var(--color-intel-accent)]"></div>
                    <h1 className="text-intel-text-light font-mono font-bold text-2xl tracking-[0.2em] shrink-0 drop-shadow-[0_0_8px_rgba(224,242,254,0.5)]">
                        INTELMAP
                    </h1>
                </div>

                <nav className="flex gap-4 h-full pt-4">
                    <button
                        onClick={() => setActiveModule('flights')}
                        className={`px-4 h-full border-b-2 font-mono text-sm tracking-widest uppercase transition-all ${activeModule === 'flights'
                                ? 'border-intel-accent text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)] bg-gradient-to-t from-intel-accent/10 to-transparent'
                                : 'border-transparent text-intel-text hover:text-intel-text-light hover:border-intel-text/50 opacity-70 hover:opacity-100'
                            }`}
                    >
                        Flights
                    </button>
                    <button
                        onClick={() => setActiveModule('maritime')}
                        className={`px-4 h-full border-b-2 font-mono text-sm tracking-widest uppercase transition-all ${activeModule === 'maritime'
                                ? 'border-intel-accent text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)] bg-gradient-to-t from-intel-accent/10 to-transparent'
                                : 'border-transparent text-intel-text hover:text-intel-text-light hover:border-intel-text/50 opacity-70 hover:opacity-100'
                            }`}
                    >
                        Maritime
                    </button>
                    <button
                        onClick={() => setActiveModule('monitor')}
                        className={`px-4 h-full border-b-2 font-mono text-sm tracking-widest uppercase transition-all ${activeModule === 'monitor'
                                ? 'border-intel-accent text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)] bg-gradient-to-t from-intel-accent/10 to-transparent'
                                : 'border-transparent text-intel-text hover:text-intel-text-light hover:border-intel-text/50 opacity-70 hover:opacity-100'
                            }`}
                    >
                        Monitor
                    </button>
                </nav>
            </div>

            {/* Right side: View toggles */}
            <div className="flex gap-4 items-center h-full text-intel-text font-mono text-xs tracking-wider">
                <div className="flex items-center gap-2 border-r border-intel-accent/30 pr-4 h-8">
                    <span className="opacity-50">PROJECTION:</span>
                    <button
                        onClick={() => setMapProjection(mapProjection === 'mercator' ? 'globe' : 'mercator')}
                        className={`px-3 py-1 bg-intel-bg border border-intel-accent/50 text-intel-accent hover:bg-intel-accent/10 hover:shadow-[0_0_8px_var(--color-intel-accent)] transition-all uppercase`}
                    >
                        {mapProjection}
                    </button>
                </div>

                <div className="flex items-center gap-2 h-8">
                    <span className="opacity-50">SENSOR:</span>
                    {(['eo', 'flir', 'crt'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1 transition-all uppercase border ${mode === m
                                    ? 'border-intel-accent bg-intel-accent/10 text-intel-accent shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                                    : 'border-intel-panel bg-intel-bg hover:border-intel-accent/50 text-intel-text'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};
