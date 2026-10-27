import { Loader2, MailCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../api/auth.api';
import AuthShell from '../../components/auth/AuthShell';
import FormAlert from '../../components/auth/FormAlert';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { parseApiError } from '../../utils/apiError';
import { EMAIL_PATTERN } from '../../utils/validation';

const BACK_TO_SIGN_IN = (
  <p>
    Remembered it?{' '}
    <Link to="/login" className="font-semibold text-ink hover:underline">
      Back to sign in
    </Link>
  </p>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  /** The address the request was sent for; set once the server has accepted it. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setFieldError('Enter a valid email address');
      emailRef.current?.focus();
      return;
    }
    setFieldError('');

    setSubmitting(true);
    try {
      await requestPasswordReset(address);
      setSentTo(address);
    } catch (error) {
      const { message, fields } = parseApiError(error);
      setFieldError(fields.email ?? '');
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={BACK_TO_SIGN_IN}>
        <div className="space-y-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
            <MailCheck size={24} aria-hidden="true" />
          </span>
          <p>
            If an account exists for <strong className="break-words">{sentTo}</strong>, we have sent a link to reset the password. The link works once and expires in 1 hour.
          </p>
          <p className="text-sm text-muted">Nothing in your inbox? Check your spam folder, or try again with a different address.</p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter the email you signed up with and we will send you a link to choose a new one." footer={BACK_TO_SIGN_IN}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert message={formError} />
        <Input
          ref={emailRef}
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />
        <Button type="submit" size="lg" fullWidth disabled={submitting} leftIcon={submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : undefined}>
          {submitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
