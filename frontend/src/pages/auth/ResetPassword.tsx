import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/auth.api';
import AuthShell from '../../components/auth/AuthShell';
import FormAlert from '../../components/auth/FormAlert';
import PasswordInput from '../../components/auth/PasswordInput';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/apiError';
import { passwordProblem } from '../../utils/validation';

const BACK_TO_SIGN_IN = (
  <p>
    <Link to="/login" className="font-semibold text-ink hover:underline">
      Back to sign in
    </Link>
  </p>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();

  // The token is kept in memory and taken out of the address bar, so it does not sit in the
  // browser history or show up in a screenshot.
  const [token] = useState(() => params.get('token') ?? '');
  useEffect(() => {
    if (params.has('token')) setParams({}, { replace: true });
  }, [params, setParams]);

  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [linkBroken, setLinkBroken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (!token || linkBroken) {
    return (
      <AuthShell
        title="This link does not work"
        subtitle="The reset link is not valid, has expired, or was already used. Links work once and last 1 hour."
        footer={BACK_TO_SIGN_IN}
      >
        <Button to="/forgot-password" size="lg" fullWidth>
          Request a new link
        </Button>
      </AuthShell>
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const problem = passwordProblem(password);
    setFieldError(problem ?? '');
    if (problem) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      await resetPassword({ token, password });
      // Every session that existed before the reset is signed out by the server; do the same here.
      logout();
      navigate('/login', { replace: true, state: { notice: 'Your password has been updated. Sign in with your new password.' } });
    } catch (error) {
      const { message, fields, status } = parseApiError(error);
      if (fields.password) {
        setFieldError(fields.password);
        passwordRef.current?.focus();
      } else if (status === 400) {
        setLinkBroken(true); // bad, expired or used link
      } else {
        setFormError(message); // too many attempts, server down, no connection
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Pick one you have not used before." footer={BACK_TO_SIGN_IN}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert message={formError} />
        <PasswordInput
          ref={passwordRef}
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError}
        />
        <Button type="submit" size="lg" fullWidth disabled={submitting} leftIcon={submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : undefined}>
          {submitting ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
