import type { Priority } from '@/types/report';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

const priorityIcons: Record<Priority, string> = {
  low: '●',
  medium: '▲',
  high: '⬆',
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${priorityStyles[priority]}`}
    >
      <span>{priorityIcons[priority]}</span>
      <span className="capitalize">{priority}</span>
    </span>
  );
}
