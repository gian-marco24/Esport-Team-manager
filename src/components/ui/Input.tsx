import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-300 whitespace-nowrap truncate">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#180d29] border rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
              leftIcon ? 'pl-10 sm:pl-11' : 'pl-3.5 sm:pl-4'
            } ${rightIcon ? 'pr-10 sm:pr-11' : 'pr-3.5 sm:pr-4'} ${
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-[#522B80]/60 focus:border-[#8B44F7] focus:ring-1 focus:ring-[#8B44F7] hover:border-[#8B44F7]/50'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs sm:text-sm text-red-400 mt-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs sm:text-sm text-gray-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
