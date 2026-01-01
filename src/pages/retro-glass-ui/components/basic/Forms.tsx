import React from 'react';

// --- Buttons ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) => {
  const baseStyles = "relative font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#2c3e50] text-[#fdfbf7] border border-[#2c3e50] shadow-sm hover:bg-[#34495e]",
    secondary: "bg-[#fdfbf7] text-[#2c3e50] border border-[#d1d5db] shadow-sm hover:bg-[#f3f4f6]",
    ghost: "text-[#5d6d7e] hover:text-[#2c3e50] hover:bg-[#2c3e50]/5"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-base rounded-lg",
    lg: "px-6 py-3 text-lg rounded-xl"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
};

// --- Inputs ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#5d6d7e] mb-1.5">{label}</label>}
      <input
        className={`
          w-full px-4 py-2
          bg-[#fdfbf7] border border-[#d1d5db]
          rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]
          focus:outline-none focus:ring-2 focus:ring-[#5d6d7e]/20 focus:border-[#5d6d7e]
          font-display text-[#2c3e50] placeholder:text-[#9ca3af]
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const TextArea = ({ label, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#5d6d7e] mb-1.5">{label}</label>}
      <textarea
        className={`
          w-full px-4 py-3
          bg-[#fdfbf7] border border-[#d1d5db]
          rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]
          focus:outline-none focus:ring-2 focus:ring-[#5d6d7e]/20 focus:border-[#5d6d7e]
          font-display text-[#2c3e50] placeholder:text-[#9ca3af]
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
};
