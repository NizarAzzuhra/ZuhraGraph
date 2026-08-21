import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`bg-[var(--color-surface)] border border-[var(--color-border-line)] p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
