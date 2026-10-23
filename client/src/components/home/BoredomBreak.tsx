import { Coffee } from 'lucide-react';
import { getMiniGames } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import GameCard from '../games/GameCard';
import Card from '../ui/Card';
import Reveal from '../ui/Reveal';

export default function BoredomBreak() {
  const { data: games } = useAsync(getMiniGames);

  return (
    <section aria-labelledby="break-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <Card tone="night" padding="lg" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-2xl" aria-hidden="true" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
                <Coffee size={24} aria-hidden="true" />
              </span>
              <h2 id="break-title" className="text-3xl font-semibold sm:text-4xl">
                Feeling bored? Take a 2-minute break.
              </h2>
              <p className="mt-3 max-w-md text-night-fg/75">
                Step away from the page with a quick game, then dive back in. Every win earns bonus points.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {(games ?? []).map((game) => (
                <li key={game.id}>
                  <GameCard game={game} />
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
