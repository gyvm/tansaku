import React from 'react';

// 13. NeonBadge: ネオン管風バッジ（レトロフューチャー）
export const NeonBadge = ({ text, color = 'pink' }: { text: string, color?: 'pink' | 'blue' | 'green' }) => {
  const colors = {
    pink: { text: '#ff71ce', glow: 'rgba(255, 113, 206, 0.5)', border: '#b967ff' },
    blue: { text: '#01cdfe', glow: 'rgba(1, 205, 254, 0.5)', border: '#05ffa1' },
    green: { text: '#b967ff', glow: 'rgba(185, 103, 255, 0.5)', border: '#ff71ce' }
  };

  const theme = colors[color];

  return (
    <div
      className="inline-block px-4 py-1 rounded border-2 font-display uppercase tracking-widest text-sm bg-black/80 backdrop-blur-sm"
      style={{
        color: theme.text,
        borderColor: theme.border,
        boxShadow: `0 0 5px ${theme.glow}, inset 0 0 5px ${theme.glow}`,
        textShadow: `0 0 5px ${theme.glow}, 0 0 10px ${theme.glow}`
      }}
    >
      {text}
    </div>
  );
};
