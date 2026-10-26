import { CircleAlert } from 'lucide-react';

/** A form-level error. Renders nothing when there is no message. */
export default function FormAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
