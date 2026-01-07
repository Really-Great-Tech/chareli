import React from 'react';
import { Search } from 'lucide-react';
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
  icon = <Search className="w-12 h-12 text-gray-400" />,
  className
}: NoResultsProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4",
      "bg-transparent",
      className
    )}>
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {message}
      </p>
    </div>
  );
}
