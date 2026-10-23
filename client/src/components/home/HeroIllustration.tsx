import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FloatingProps {
  className: string;
  delay: string;
  children: ReactNode;
}

function Floating({ className, delay, children }: FloatingProps) {
  return (
    <div className={cn('absolute animate-float', className)} style={{ animationDelay: delay }} aria-hidden="true">
      {children}
    </div>
  );
}

/** Original artwork: a stack of books with floating stars and point chips. Colors are theme tokens. */
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" role="img" aria-label="A stack of books surrounded by floating stars and reward points">
      <div className="absolute inset-6 rounded-full bg-accent-soft" aria-hidden="true" />
      <div className="absolute inset-16 rounded-full bg-surface-raised/70" aria-hidden="true" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* shadow */}
        <ellipse cx="200" cy="338" rx="130" ry="14" className="fill-primary/15" />

        {/* bottom book */}
        <rect x="70" y="270" width="260" height="62" rx="8" className="fill-primary" />
        <rect x="70" y="270" width="26" height="62" rx="8" className="fill-night" />
        <rect x="104" y="280" width="214" height="42" rx="4" className="fill-surface-raised" />
        <rect x="104" y="289" width="150" height="5" rx="2.5" className="fill-muted-line" />
        <rect x="104" y="300" width="110" height="5" rx="2.5" className="fill-muted-line" />

        {/* second book */}
        <rect x="96" y="214" width="228" height="56" rx="8" className="fill-cover-1" />
        <rect x="96" y="214" width="24" height="56" rx="8" className="fill-night/50" />
        <rect x="128" y="222" width="188" height="40" rx="4" className="fill-surface-raised" />
        <rect x="128" y="231" width="120" height="5" rx="2.5" className="fill-muted-line" />
        <rect x="128" y="242" width="86" height="5" rx="2.5" className="fill-muted-line" />

        {/* third book */}
        <rect x="82" y="162" width="236" height="52" rx="8" className="fill-cover-2" />
        <rect x="82" y="162" width="22" height="52" rx="8" className="fill-night/50" />
        <rect x="112" y="170" width="198" height="36" rx="4" className="fill-surface-raised" />
        <rect x="112" y="179" width="132" height="5" rx="2.5" className="fill-muted-line" />

        {/* top book, tilted and open */}
        <g transform="rotate(-8 200 150)">
          <path d="M110 150 Q155 128 200 146 Q245 128 290 150 L290 118 Q245 98 200 116 Q155 98 110 118 Z" className="fill-surface-raised" />
          <path d="M200 116 L200 146" className="stroke-muted-line" strokeWidth="3" fill="none" />
          <path d="M126 128 Q158 116 188 128 M126 138 Q158 126 188 138 M212 128 Q242 116 274 128 M212 138 Q242 126 274 138" className="stroke-muted-line" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* bookmark ribbon */}
          <path d="M236 114 L236 164 L246 154 L256 164 L256 112 Z" className="fill-accent" />
        </g>
      </svg>

      <Floating className="left-[6%] top-[14%]" delay="0s">
        <Star size={34} className="fill-accent text-accent" />
      </Floating>
      <Floating className="right-[8%] top-[8%]" delay="1.2s">
        <Star size={22} className="fill-accent text-accent" />
      </Floating>
      <Floating className="right-[2%] top-[34%]" delay="2.1s">
        <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-fg shadow-lift">+10 pts</span>
      </Floating>
      <Floating className="left-[0%] top-[44%]" delay="0.6s">
        <span className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg shadow-lift">7 day streak</span>
      </Floating>
      <Floating className="bottom-[10%] right-[6%]" delay="1.7s">
        <Star size={26} className="fill-accent text-accent" />
      </Floating>
    </div>
  );
}
