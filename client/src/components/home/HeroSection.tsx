import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, HelpCircle } from 'lucide-react';
import SearchBar from '../books/SearchBar';
import Button from '../ui/Button';
import HeroIllustration from './HeroIllustration';

export default function HeroSection() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:py-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-sm font-semibold text-accent-ink">
            <BookOpen size={16} aria-hidden="true" />
            Free public-domain books
          </p>
          <h1 id="hero-title" className="text-4xl font-bold leading-[1.05] sm:text-6xl">
            Read. Play. <span className="text-accent-ink">Achieve.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Turn reading into a habit you love. Build streaks, earn points for every page, and take a quick game break whenever your mind wanders.
          </p>

          <SearchBar className="mt-8 max-w-xl" />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button to="/search" size="lg" leftIcon={<BookOpen size={18} aria-hidden="true" />}>
              Start Reading
            </Button>
            <Button href="#how-it-works" size="lg" variant="secondary" leftIcon={<HelpCircle size={18} aria-hidden="true" />}>
              How it works
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}
