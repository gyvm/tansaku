import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "font-mono font-bold uppercase tracking-wider transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary/10 border-primary text-primary hover:bg-primary/20 focus:ring-primary shadow-[0_0_10px_rgba(0,210,255,0.3)] hover:shadow-[0_0_15px_rgba(0,210,255,0.5)]",
    secondary: "bg-secondary/10 border-secondary text-secondary hover:bg-secondary/20 focus:ring-secondary shadow-[0_0_10px_rgba(191,0,255,0.3)] hover:shadow-[0_0_15px_rgba(191,0,255,0.5)]",
    danger: "bg-accent/10 border-accent text-accent hover:bg-accent/20 focus:ring-accent",
    ghost: "bg-transparent border-transparent text-textMuted hover:text-text hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
