import { Clock, HelpCircle, Puzzle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GameKind, MiniGame } from '../../data/mockHome';
import PointsBadge from '../gamification/PointsBadge';
import Button from '../ui/Button';

const ICONS: Record<GameKind, LucideIcon> = {
  quiz: HelpCircle,
  puzzle: Puzzle,
};

interface GameCardProps {
  game: MiniGame;
}

export default function GameCard({ game }: GameCardProps) {
  const Icon = ICONS[game.kind];
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-night-fg/15 bg-night-fg/10 p-5 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-night-fg/15 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg">
          <Icon size={24} aria-hidden="true" />
        </span>
        <PointsBadge points={game.rewardPoints} size="sm" prefix />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold">{game.title}</h3>
        <p className="mt-1 text-sm text-night-fg/75">{game.description}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-night-fg/75">
          <Clock size={16} aria-hidden="true" />
          {game.durationMinutes} min
        </span>
        <Button to="/games" variant="accent" size="sm">
          Play
          <span className="sr-only"> {game.title}</span>
        </Button>
      </div>
    </article>
  );
}
