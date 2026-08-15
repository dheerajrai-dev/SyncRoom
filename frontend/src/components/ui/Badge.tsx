import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'host';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#E7E1D3] text-[#38352F]',
    success: 'bg-[#E3F3E8] text-[#1F8A4C]',
    warning: 'bg-[#FBE9D6] text-[#D9720F]',
    danger: 'bg-[#FBEAE6] text-[#C23B2E]',
    info: 'bg-[#FBE9D6] text-[#D9720F]',
    host: 'bg-[#FBE9D6] text-[#D9720F] font-semibold',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
