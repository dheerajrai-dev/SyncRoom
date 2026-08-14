import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(interactive ? 'glass-card' : 'glass-panel p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
