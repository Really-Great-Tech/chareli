import { Card } from '../../../components/ui/card';

interface CacheStatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'yellow' | 'red' | 'blue';
  subtitle?: string;
}

export function CacheStatsCard({
  label,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle,
}: CacheStatsCardProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };

  const bgColorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
  };

  return (
    <Card
      className={`${bgColorClasses[color]} border-none shadow-none p-6 transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${colorClasses[color]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-3 ${bgColorClasses[color]}`}>
            <img src={icon} alt="" className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
          {trend === 'up' && (
            <span className="text-green-600 dark:text-green-400">
              ↑ Trending up
            </span>
          )}
          {trend === 'down' && (
            <span className="text-red-600 dark:text-red-400">
              ↓ Trending down
            </span>
          )}
          {trend === 'neutral' && (
            <span className="text-gray-600 dark:text-gray-400">→ Stable</span>
          )}
        </div>
      )}
    </Card>
  );
}
