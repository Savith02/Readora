import { TrendingDown, TrendingUp } from 'lucide-react';
import { getTodayStats } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import PointsBadge from '../gamification/PointsBadge';
import StreakCounter from '../gamification/StreakCounter';
import Card from '../ui/Card';
import CircularProgress from '../ui/CircularProgress';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

export default function TodayProgress() {
  const { data: stats } = useAsync(getTodayStats);

  if (!stats) return null;

  const goalPct = (stats.pagesRead / stats.dailyGoal) * 100;
  const remaining = Math.max(stats.dailyGoal - stats.pagesRead, 0);
  const delta = stats.pointsToday - stats.pointsYesterday;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;

  return (
    <section aria-labelledby="progress-title" className="gutter py-6">
      <Reveal>
        <SectionHeader variant="row" id="progress-title" title="Today's progress" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center gap-5">
            <CircularProgress value={goalPct} label="Daily reading goal">
              <span className="font-serif text-2xl font-semibold leading-none">{stats.pagesRead}</span>
              <span className="text-xs text-muted">of {stats.dailyGoal}</span>
            </CircularProgress>
            <div>
              <h3 className="text-lg font-semibold">Daily goal</h3>
              <p className="mt-1 text-sm text-muted">
                {remaining > 0 ? `${remaining} more pages to hit your goal.` : 'Goal reached. Nice work!'}
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold">Current streak</h3>
            <StreakCounter variant="card" days={stats.streak} week={stats.week} />
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <h3 className="text-lg font-semibold">Points earned today</h3>
            <PointsBadge points={stats.pointsToday} size="lg" prefix className="self-start" />
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <TrendIcon size={16} aria-hidden="true" />
              {Math.abs(delta)} {delta >= 0 ? 'more' : 'fewer'} than yesterday
            </p>
          </Card>
        </div>
      </Reveal>
    </section>
  );
}
