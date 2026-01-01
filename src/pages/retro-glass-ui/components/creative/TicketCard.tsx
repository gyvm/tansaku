import React from 'react';

// 7. TicketCard: ミシン目入りのチケット
export const TicketCard = ({ event, date, seat }: { event: string, date: string, seat: string }) => {
  return (
    <div className="flex w-full max-w-sm drop-shadow-md filter">
      {/* Main Ticket Body */}
      <div className="flex-1 bg-[#fdfbf7] p-4 rounded-l-lg border-y border-l border-[#d1d5db] relative">
        <h3 className="font-display text-lg font-bold text-[#2c3e50] uppercase tracking-wider mb-1">{event}</h3>
        <p className="text-xs text-[#5d6d7e] uppercase mb-4">Admit One</p>
        <div className="flex justify-between items-end">
          <div className="text-sm font-bold text-[#34495e]">{date}</div>
          <div className="barcode h-8 w-24 bg-current opacity-80"
               style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)' }}>
          </div>
        </div>

        {/* Perforation dots on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] border-r-2 border-dotted border-[#d1d5db] translate-x-[1px]" />
      </div>

      {/* Stub */}
      <div className="w-24 bg-[#fdfbf7] p-4 rounded-r-lg border-y border-r border-[#d1d5db] flex flex-col justify-center items-center text-center relative">
        {/* Cutout notches */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#e8eaf0] rounded-full" />

        <span className="text-[10px] text-[#9ca3af] uppercase mb-1">Seat</span>
        <span className="font-display text-xl font-bold text-[#c0392b]">{seat}</span>
      </div>
    </div>
  );
};
