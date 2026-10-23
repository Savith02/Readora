import { BookOpen, Gamepad2, Search, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Card from '../ui/Card';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

interface Step {
  title: string;
  text: string;
  icon: LucideIcon;
}

const STEPS: readonly Step[] = [
  { title: 'Search a book', text: 'Find any public-domain title by name, author or genre.', icon: Search },
  { title: 'Read', text: 'Earn points for every page and bonus points for finishing chapters.', icon: BookOpen },
  { title: 'Take a fun break', text: 'Bored? Play a short quiz or word puzzle and come back fresh.', icon: Gamepad2 },
  { title: 'Earn points & climb', text: 'Keep your streak, complete tasks and rise up the leaderboard.', icon: Trophy },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader id="how-title" align="center" eyebrow="How it works" title="Four steps to a reading habit" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="relative h-full">
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-primary/10" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <step.icon size={24} aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
