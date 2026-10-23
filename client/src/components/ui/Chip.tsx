import { cn } from '../../utils/cn';

interface ChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function Chip({ label, selected, onSelect }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition duration-200',
        selected
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-muted-line bg-surface-raised text-ink hover:border-primary',
      )}
    >
      {label}
    </button>
  );
}
