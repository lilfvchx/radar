import React from 'react';
import { formatTime } from '../../../utils/time';

interface Props {
    lastUpdated: number;
    isError: boolean;
    provider: string;
}

export const FlightsStatusBar: React.FC<Props> = ({ lastUpdated, isError, provider }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-8 tech-panel flex items-center justify-between px-4 z-20 text-[10px] uppercase font-bold tracking-widest text-intel-text !border-b-0 !border-l-0 !border-r-0 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] bg-black/80">
            <div className="flex items-center gap-6 font-mono">
                <span>DATA LINK: <span className="text-intel-text-light">{provider}</span></span>
                <span className={isError ? 'text-intel-danger' : 'text-intel-success'}>
                    {isError ? 'SYS_FAULT' : 'SECURE_ACTIVE'}
                </span>
            </div>
            <div>
                LAST REFRESH: {lastUpdated ? formatTime(lastUpdated / 1000) : '--:--:--'}
            </div>
        </div>
    );
};
