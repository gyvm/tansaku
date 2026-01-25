import React from 'react';

// 10. ReceiptList: レシート風リスト
export const ReceiptList = ({ items, total }: { items: { name: string, price: string }[], total: string }) => {
  return (
    <div className="bg-white w-64 mx-auto shadow-sm filter drop-shadow-md relative">
      {/* Jagged Top */}
      <div
        className="absolute -top-2 left-0 right-0 h-2 bg-white"
        style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}
      />

      <div className="p-6 font-mono text-sm text-[#333]">
        <div className="text-center mb-6">
          <h4 className="font-bold text-lg uppercase tracking-widest border-b-2 border-dashed border-[#333] pb-2 mb-2">Receipt</h4>
          <p className="text-xs">THANK YOU FOR VISITING</p>
        </div>

        <ul className="space-y-2 mb-4">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span className="uppercase">{item.name}</span>
              <span>{item.price}</span>
            </li>
          ))}
        </ul>

        <div className="border-t-2 border-dashed border-[#333] pt-2 flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>{total}</span>
        </div>

        <div className="mt-8 text-center text-xs">
          <p>************3902</p>
          <p className="mt-2">Have a nice day!</p>
        </div>
      </div>

      {/* Jagged Bottom */}
      <div
        className="absolute -bottom-2 left-0 right-0 h-2 bg-white"
        style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}
      />
    </div>
  );
};
