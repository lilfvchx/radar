import React from 'react';
import { MonitorMap } from './components/MonitorMap';
import { LiveNewsPanel } from './components/LiveNewsPanel';
import { LiveWebcamsPanel } from './components/LiveWebcamsPanel';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { CountryInstabilityPanel } from './components/CountryInstabilityPanel';
import { StrategicPosturePanel } from './components/StrategicPosturePanel';
import { ConflictEventsPanel } from './components/ConflictEventsPanel';

export const MonitorPage: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-intel-bg font-mono overflow-hidden z-20 flex flex-col text-intel-text tracking-wide">

            {/* Top Half: Global Map */}
            <div className="h-1/2 relative w-full border-b border-intel-accent/30 shadow-[0_4px_30px_rgba(0,229,255,0.05)] z-10 bg-black">
                <MonitorMap />
            </div>

            {/* Bottom Half: 6-Panel Grid */}
            <div className="h-1/2 p-4 min-h-0 bg-gradient-to-b from-black to-intel-bg relative">
                {/* Tech grid background pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

                <div className="h-full grid grid-cols-6 gap-4 relative z-10">

                    {/* Panel 1: Live News (Bloomberg) */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-intel-accent/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <LiveNewsPanel />
                    </div>

                    {/* Panel 2: Live Webcams (Rotator) */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-intel-accent/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <LiveWebcamsPanel />
                    </div>

                    {/* Panel 3: Conflict Events (ACLED) */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <ConflictEventsPanel />
                    </div>

                    {/* Panel 4: AI Insights (OSINT Feed & Brief) */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group shadow-[0_0_20px_rgba(168,85,247,0.05)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <AIInsightsPanel />
                    </div>

                    {/* Panel 5: Country Instability Index */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CountryInstabilityPanel />
                    </div>

                    {/* Panel 6: Strategic Posture */}
                    <div className="col-span-1 tech-panel p-3 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-intel-success/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <StrategicPosturePanel />
                    </div>

                </div>
            </div>

            {/* Scanlines overlay for aesthetic */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/scanlines.png')] opacity-[0.05] mix-blend-overlay z-50"></div>
        </div>
    );
};
