import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import FormAlert from '../../components/auth/FormAlert';
import PasswordInput from '../../components/auth/PasswordInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  // ProtectedRoute sends people here with the page they were trying to open.
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const destination = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Already logged in (or just logged in): go where they were headed.
  if (user) return <Navigate to={destination} replace />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const next: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      const { message, fields } = parseApiError(error);
      setErrors({ email: fields.email, password: fields.password });
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Pick up your book and keep your streak going."
      footer={
        <p>
          New to Readora?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-ink hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
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
          error={errors.email}
        />
        <PasswordInput
          ref={passwordRef}
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" size="lg" fullWidth disabled={submitting} leftIcon={submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : undefined}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
