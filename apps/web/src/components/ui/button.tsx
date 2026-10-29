"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled,
  isLoading,
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variantClasses = {
    default: 'bg-terracotta-600 text-white hover:bg-terracotta-700 shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  }[variant];

  const sizeStyles = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-xs',
    lg: 'h-11 px-6 py-2.5 text-base',
  }[size];

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses,
        sizeStyles,
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ms-1 me-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
