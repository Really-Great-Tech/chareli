import React from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { cn } from '../../lib/utils';

interface NoResultsProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NoResults({
  title = "No results found",
  message = "Try adjusting your filters or search criteria",
  icon = <RiSearchLine className="w-12 h-12 text-gray-400" />,
  className
}: NoResultsProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4",
      "bg-[#F1F5F9] dark:bg-[#121C2D] rounded-lg",
      className
    )}>
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {message}
      </p>
    </div>
  );
}
