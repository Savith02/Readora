import { BookOpenCheck, BookText, Brain, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DailyTask, TaskKind } from '../../data/mockHome';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import PointsBadge from './PointsBadge';

const ICONS: Record<TaskKind, LucideIcon> = {
  pages: BookText,
  chapter: BookOpenCheck,
  quiz: Brain,
};

interface TaskCardProps {
  task: DailyTask;
}

export default function TaskCard({ task }: TaskCardProps) {
  const Icon = ICONS[task.kind];
  const done = task.progress >= task.target;
  const pct = (task.progress / task.target) * 100;

  return (
    <Card interactive className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon size={22} aria-hidden="true" />
        </span>
        {done ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink">
            <CheckCircle2 size={18} aria-hidden="true" />
            Done
          </span>
        ) : (
          <PointsBadge points={task.rewardPoints} size="sm" prefix />
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <p className="mt-1 text-sm text-muted">{task.description}</p>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>
            {Math.min(task.progress, task.target)} / {task.target}
          </span>
          {done && <PointsBadge points={task.rewardPoints} size="sm" prefix />}
        </div>
        <ProgressBar value={pct} label={`${task.title} progress`} />
      </div>
    </Card>
  );
}
