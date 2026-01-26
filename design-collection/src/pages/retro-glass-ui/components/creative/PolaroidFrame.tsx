import React from 'react';

// 9. PolaroidFrame: ポラロイド風画像枠
export const PolaroidFrame = ({ src, caption }: { src: string, caption: string }) => {
  return (
    <div className="bg-white p-3 pb-8 shadow-lg rotate-2 hover:rotate-0 transition-transform duration-300 ease-out w-fit mx-auto border border-gray-100">
      <div className="aspect-square w-48 bg-gray-200 overflow-hidden mb-4 filter sepia-[0.3] contrast-110">
        {src ? (
          <img src={src} alt={caption} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">NO IMAGE</div>
        )}
      </div>
      <div className="text-center font-handwriting text-[#2c3e50] text-lg font-medium transform -rotate-1">
        {caption}
      </div>
    </div>
  );
};
