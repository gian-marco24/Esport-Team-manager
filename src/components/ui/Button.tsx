import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0914] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer';

  const sizes = {
    sm: 'px-3.5 py-2 text-xs sm:text-sm',
    md: 'px-4.5 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 py-3.5 sm:px-7 sm:py-4 text-base sm:text-lg',
  };

  const variants = {
    primary:
      'bg-[#8B44F7] text-white hover:bg-[#7832e4] focus:ring-[#8B44F7] shadow-lg shadow-[#8B44F7]/25 hover:shadow-[#8B44F7]/40 active:scale-[0.98]',
    secondary:
      'bg-[#E2B86E] text-[#0D0914] hover:bg-[#d6a858] focus:ring-[#E2B86E] shadow-lg shadow-[#E2B86E]/20 hover:shadow-[#E2B86E]/35 font-bold active:scale-[0.98]',
    gold:
      'bg-[#E2B86E] text-[#0D0914] hover:bg-[#d6a858] focus:ring-[#E2B86E] shadow-lg shadow-[#E2B86E]/25 font-bold active:scale-[0.98]',
    outline:
      'border border-[#8B44F7]/40 bg-[#26143E]/40 text-[#E2B86E] hover:bg-[#522B80]/40 hover:border-[#8B44F7] focus:ring-[#8B44F7]',
    ghost:
      'text-gray-300 hover:text-white hover:bg-[#26143E]/60 focus:ring-[#522B80]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md shadow-red-900/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
