import { Fragment } from 'react';
export default function Marquee({ items = [], reverse = false, className = '', itemClass = '', separator = '✦', speed }) {
  const list = items.length ? items : ['POPSYY'];
  const row = (
    <div className="flex shrink-0 items-center">
      {[...list, ...list].map((t, i) => (
        <Fragment key={i}>
          <span className={`whitespace-nowrap px-5 ${itemClass}`}>{t}</span>
          <span aria-hidden className="px-1 opacity-80">{separator}</span>
        </Fragment>
      ))}
    </div>
  );
  return (
    <div className={`relative flex overflow-hidden ${className}`} aria-label={list.join(' · ')}>
      <div className={`flex w-max ${reverse ? 'animate-marquee-rev' : 'animate-marquee'} hover:[animation-play-state:paused]`} style={speed ? { animationDuration: `${speed}s` } : undefined} aria-hidden>
        {row}{row}
      </div>
    </div>
  );
}
