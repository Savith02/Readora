import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'light' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
}

type ButtonProps = BaseProps & { to?: undefined; href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;
type RouterLinkProps = BaseProps & { to: string; href?: undefined } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | 'href'>;
type AnchorProps = BaseProps & { href: string; to?: undefined } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps>;

export type Props = ButtonProps | RouterLinkProps | AnchorProps;

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:opacity-90 shadow-soft',
  secondary: 'border border-muted-line bg-surface-raised text-ink hover:border-primary hover:text-primary',
  accent: 'bg-accent text-accent-fg hover:brightness-105 shadow-soft',
  ghost: 'text-ink hover:bg-surface-sunken',
  // Hero pair: solid "play" button and a translucent "more info" button.
  light: 'bg-ink text-surface hover:bg-ink/85 shadow-soft',
  glass: 'bg-ink/20 text-ink backdrop-blur-sm hover:bg-ink/30',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

export default function Button(props: Props) {
  const { variant = 'primary', size = 'md', fullWidth, leftIcon, rightIcon, children, className, ...rest } = props;

  const classes = cn(
    'inline-flex items-center justify-center rounded-full font-semibold transition duration-200',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );

  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as Omit<RouterLinkProps, keyof BaseProps>;
    return (
      <Link to={to} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }
  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<AnchorProps, keyof BaseProps>;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {content}
      </a>
    );
  }
  const { to: _to, href: _href, ...buttonRest } = rest as Omit<ButtonProps, keyof BaseProps>;
  return (
    <button type="button" className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
