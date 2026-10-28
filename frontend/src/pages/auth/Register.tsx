import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import FormAlert from '../../components/auth/FormAlert';
import PasswordInput from '../../components/auth/PasswordInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';
import { EMAIL_PATTERN, passwordProblem } from '../../utils/validation';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address';
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  return errors;
}

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const destination = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'admin'>('user');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : destination.startsWith('/admin') ? '/' : destination} replace />;

  const focusFirstError = (found: FieldErrors) => {
    const order: Array<[keyof FieldErrors, RefObject<HTMLInputElement | null>]> = [
      ['name', nameRef],
      ['email', emailRef],
      ['password', passwordRef],
    ];
    order.find(([field]) => found[field])?.[1].current?.focus();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const found = validate(name, email, password);
    setErrors(found);
    if (Object.keys(found).length > 0) return focusFirstError(found);

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, accountType });
    } catch (error) {
      const { message, fields } = parseApiError(error);
      const serverErrors: FieldErrors = { name: fields.name, email: fields.email, password: fields.password };
      setErrors(serverErrors);
      setFormError(message);
      focusFirstError(serverErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={accountType === 'admin' ? 'Create an admin account' : 'Create your account'}
      subtitle={accountType === 'admin' ? 'Set up your Readora administrator account.' : 'Join Readora to read, play, and earn points.'}
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-ink hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert message={formError} />
        <fieldset disabled={submitting}>
          <legend className="mb-2 text-sm font-medium">Create account as</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['user', 'admin'] as const).map(type => <label key={type} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${accountType === type ? 'border-accent bg-accent/10 text-accent-ink' : 'border-muted-line hover:bg-surface-sunken'}`}>
              <input type="radio" name="accountType" value={type} checked={accountType === type} className="h-4 w-4 accent-[rgb(var(--accent))]" onChange={() => { setAccountType(type); setErrors({}); setFormError(''); }} />
              {type === 'admin' ? 'Admin account' : 'User account'}
            </label>)}
          </div>
        </fieldset>
        <Input ref={nameRef} label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
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
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" size="lg" fullWidth disabled={submitting} leftIcon={submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : undefined}>
          {submitting ? 'Creating account...' : accountType === 'admin' ? 'Create admin account' : 'Create user account'}
        </Button>
      </form>
    </AuthShell>
  );
}
