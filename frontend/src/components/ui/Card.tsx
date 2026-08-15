import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card p-6 transition-colors',
        interactive && 'hover:border-[#D6CFC0] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
