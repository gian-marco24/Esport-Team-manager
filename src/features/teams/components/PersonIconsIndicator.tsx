import React from 'react';
import { User } from 'lucide-react';

interface PersonIconsIndicatorProps {
  total: number;
  count: number;
  activeColorClass?: string;
  inactiveColorClass?: string;
  iconSizeClass?: string;
  gapClass?: string;
}

export const PersonIconsIndicator: React.FC<PersonIconsIndicatorProps> = ({
  total,
  count,
  activeColorClass = 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]',
  inactiveColorClass = 'text-gray-600/40',
  iconSizeClass = 'w-4 h-4',
  gapClass = 'space-x-1',
}) => {
  return (
    <div className={`flex items-center ${gapClass}`}>
      {Array.from({ length: total }).map((_, index) => {
        const isFilled = index < count;
        return (
          <User
            key={index}
            className={`${iconSizeClass} transition-all duration-200 ${
              isFilled ? activeColorClass : inactiveColorClass
            }`}
          />
        );
      })}
    </div>
  );
};
