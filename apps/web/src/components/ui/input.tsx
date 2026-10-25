"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  maxLength,
  className,
  ...props
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      maxLength={maxLength ?? 50}
      className={cn(
        "w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        className,
      )}
      {...props}
    />
  );
}

export default Input;
