"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled,
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent',
    ghost: 'hover:bg-accent/20',
  }[variant];

  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 py-1.5',
    lg: 'h-11 px-8 py-3',
  }[size];

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses,
        sizeStyles,
        'hover:bg-secondary hover:text-secondary-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
