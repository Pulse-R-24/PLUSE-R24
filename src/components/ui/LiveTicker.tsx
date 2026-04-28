import React from 'react';
import { NewsItem } from '../../types';
import { CITY_COORDINATES } from '../../constants';

const SEV_CLS_MAP: Record<string, string> = {
    critical: 'text-red-500 bg-red-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-yellow-600 bg-yellow-500/10',
    low: 'text-blue-500 bg-blue-500/10',
    info: 'text-slate-500 bg-slate-500/10'
};

interface LiveTickerProps {
  items: NewsItem[];
  onFlyTo: (coords: [number, number]) => void;
}

export function LiveTicker({ items, onFlyTo }: LiveTickerProps) {
  const tickerItems = [...items, ...items, ...items];

  if (tickerItems.length === 0) return null;

  const handleFlyTo = (locTag: string) => {
    const rawCoords = CITY_COORDINATES[locTag.toLowerCase()] || CITY_COORDINATES['national'];
    // Const is [lon, lat], Leaflet wants [lat, lon]
    onFlyTo([rawCoords[1], rawCoords[0]]);
  };

  return (
    <div className="w-full flex items-center overflow-hidden relative h-full bg-black">
      {/* Scrolling Tape */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="animate-marquee whitespace-nowrap flex items-center h-full absolute">
          {tickerItems.map((item, idx) => {
            const locTag = item.tags?.find(tag => CITY_COORDINATES[tag.toLowerCase()] !== undefined) || 'NATIONAL';
            const title = item.blocks.find(b => b.type === 'title')?.value as string || 'Untitled Intel';
            const sevColor = SEV_CLS_MAP[item.severity || 'info'] || 'text-slate-500';
            const isOsint = item.tags?.includes('OSINT');

            return (
              <span key={`${item.id}-${idx}`} className="inline-flex items-center mx-6 cursor-pointer hover:bg-slate-800/50 px-3 py-1 rounded transition-colors" onClick={() => handleFlyTo(locTag)}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${sevColor} mr-3 flex-shrink-0`}>
                  {item.severity}
                </span>
                {isOsint && (
                  <span className="text-emerald-400 font-mono text-[9px] uppercase font-black mr-2 border border-emerald-500/30 px-1.5 py-0.5 rounded bg-emerald-500/10 flex-shrink-0 animate-pulse">
                    LIVE
                  </span>
                )}
                <span className="text-maroon-300 font-mono text-xs uppercase tracking-wider font-bold mr-2 flex-shrink-0">
                  [{locTag}]
                </span>
                <span className="text-slate-300 text-sm font-playfair hover:text-white transition-colors truncate max-w-md">
                  {title}
                </span>
                <span className="mx-6 text-slate-700 flex-shrink-0">//</span>
              </span>
            );
          })}
          {/* Duplicate for seamless infinite scroll */}
          {tickerItems.map((item, idx) => {
            const locTag = item.tags?.find(tag => CITY_COORDINATES[tag.toLowerCase()] !== undefined) || 'NATIONAL';
            const title = item.blocks.find(b => b.type === 'title')?.value as string || 'Untitled Intel';
            const sevColor = SEV_CLS_MAP[item.severity || 'info'] || 'text-slate-500';
            const isOsint = item.tags?.includes('OSINT');

            return (
              <span key={`dup-${item.id}-${idx}`} className="inline-flex items-center mx-6 cursor-pointer hover:bg-slate-800/50 px-3 py-1 rounded transition-colors" onClick={() => handleFlyTo(locTag)}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${sevColor} mr-3 flex-shrink-0`}>
                  {item.severity}
                </span>
                {isOsint && (
                  <span className="text-blue-400 font-mono text-[10px] uppercase font-bold mr-2 border border-blue-500/30 px-1 rounded bg-blue-500/10 flex-shrink-0">
                    OSINT
                  </span>
                )}
                <span className="text-maroon-300 font-mono text-xs uppercase tracking-wider font-bold mr-2 flex-shrink-0">
                  [{locTag}]
                </span>
                <span className="text-slate-300 text-sm font-playfair hover:text-white transition-colors truncate max-w-md">
                  {title}
                </span>
                <span className="mx-6 text-slate-700 flex-shrink-0">//</span>
              </span>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
