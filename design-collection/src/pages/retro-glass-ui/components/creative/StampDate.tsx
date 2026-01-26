import React from 'react';

// 12. StampDate: 消印風日付表示
export const StampDate = ({ date, location = "TOKYO" }: { date: string, location?: string }) => {
  return (
    <div className="w-24 h-24 rounded-full border-2 border-[#2c3e50]/60 flex flex-col items-center justify-center -rotate-12 select-none pointer-events-none opacity-80"
         style={{ maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=)' /* Rough mask simulation would be better with real image */ }}>
      {/* Wavy lines decoration */}
      <div className="absolute inset-0 flex flex-col justify-between py-2 -z-10 opacity-30">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-full h-[1px] bg-[#2c3e50]" />
        ))}
      </div>

      <div className="font-display text-[10px] tracking-widest text-[#2c3e50] uppercase">{location}</div>
      <div className="font-display text-sm font-bold text-[#2c3e50] my-1">{date}</div>
      <div className="font-display text-[8px] text-[#2c3e50]">POST MARK</div>
    </div>
  );
};
