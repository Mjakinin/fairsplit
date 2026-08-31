import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-dark-card border border-dark-border rounded-2xl p-5 shadow-lg transition-all ${
        hover ? 'hover:border-white/20 hover:shadow-xl hover:translate-y-[-1px] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
