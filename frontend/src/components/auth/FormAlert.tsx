import { CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FormAlertProps {
  message: string;
  /** `error` (default) or a `success` note such as "Your password has been updated". */
  tone?: 'error' | 'success';
}

/** A form-level message. Renders nothing when there is no message. */
export default function FormAlert({ message, tone = 'error' }: FormAlertProps) {
  if (!message) return null;
  const success = tone === 'success';
  const Icon = success ? CircleCheck : CircleAlert;
  return (
    <div
      role={success ? 'status' : 'alert'}
      className={cn('mb-5 flex items-start gap-2.5 rounded-md px-4 py-3 text-sm font-medium', success ? 'bg-accent-soft text-accent-ink' : 'bg-danger-soft text-danger')}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
