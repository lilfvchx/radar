import { useQuery } from '@tanstack/react-query';
import { Crosshair, Plane, Ship, ShieldAlert, Shield, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface TheaterPosture {
    theater: string;
    postureLevel: 'critical' | 'elevated' | 'normal';
    activeFlights: number;
    trackedVessels: number;
    activeOperations: string[];
    assessedAt: number;
}

const getPostureIcon = (level: string) => {
    switch (level) {
        case 'critical': return <ShieldAlert size={20} className="text-red-500 animate-pulse" />;
        case 'elevated': return <Shield size={20} className="text-orange-500" />;
        default: return <ShieldCheck size={20} className="text-green-500" />;
    }
};

const getPostureColor = (level: string) => {
    switch (level) {
        case 'critical': return 'text-red-400 bg-red-500/5 border-red-500/40 hover:bg-red-500/10 hover:border-red-500/60 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]';
        case 'elevated': return 'text-orange-400 bg-orange-500/5 border-orange-500/40 hover:bg-orange-500/10 hover:border-orange-500/60 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]';
        default: return 'text-intel-success bg-intel-success/5 border-intel-success/40 hover:bg-intel-success/10 hover:border-intel-success/60 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]';
    }
};

const formatTheaterName = (id: string) => {
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export function StrategicPosturePanel() {
    const { data: theaters, isLoading, error } = useQuery({
        queryKey: ['monitor', 'posture'],
        queryFn: async () => {
            const res = await fetch('/api/monitor/posture');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.theaters as TheaterPosture[];
        },
        refetchInterval: 15000, // 15s
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between uppercase tracking-widest text-xs font-bold text-intel-text-light tech-panel-header pb-2">
                <div className="flex items-center gap-2">
                    <Crosshair size={14} className="text-intel-accent drop-shadow-[0_0_8px_var(--color-intel-accent)]" />
                    <span>Strategic Posture</span>
                </div>
                {isLoading && <span className="text-intel-accent animate-pulse">SCANNING...</span>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400/70 text-sm gap-2">
                        <ShieldAlert size={24} />
                        <span>Radar Offline</span>
                    </div>
                ) : !theaters ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-md border border-white/5" />
                        ))}
                    </div>
                ) : (
                    theaters.map((theater) => (
                        <div key={theater.theater} className={clsx(
                            "relative overflow-hidden p-3 border",
                            "backdrop-blur-sm transition-all duration-300",
                            getPostureColor(theater.postureLevel)
                        )}>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    {getPostureIcon(theater.postureLevel)}
                                    <span className="text-lg font-bold tracking-wider uppercase">
                                        {formatTheaterName(theater.theater)}
                                    </span>
                                </div>
                                <span className={clsx(
                                    "text-xs font-mono uppercase px-2 py-0.5 rounded border tracking-widest",
                                    theater.postureLevel === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                        theater.postureLevel === 'elevated' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' :
                                            'bg-green-500/20 border-green-500/50 text-green-300'
                                )}>
                                    {theater.postureLevel}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 relative z-10">
                                <div className="flex items-center gap-2 bg-black/40 p-2 border border-intel-accent/10">
                                    <Plane size={16} className="text-intel-accent opacity-70" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-intel-text uppercase tracking-wider">Air Assets</span>
                                        <span className="font-mono text-sm font-bold text-intel-text-light">{theater.activeFlights}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-2 border border-intel-accent/10">
                                    <Ship size={16} className="text-intel-accent opacity-70" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-intel-text uppercase tracking-wider">Naval Assets</span>
                                        <span className="font-mono text-sm font-bold text-intel-text-light">{theater.trackedVessels}</span>
                                    </div>
                                </div>
                            </div>

                            {theater.activeOperations.length > 0 && (
                                <div className="mt-3 flex gap-2 flex-wrap">
                                    {theater.activeOperations.map(op => (
                                        <span key={op} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                                            {op.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
