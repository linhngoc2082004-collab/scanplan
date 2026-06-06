import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import OrangeButton from '../components/OrangeButton';
import { signup } from '../lib/backendApi';

interface TouchedState {
  fullName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  terms: boolean;
}

export default function CreateAccount() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<TouchedState>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fullNameError = fullName.length < 2 ? 'Name must be at least 2 characters' : '';
  const emailError = !email ? 'Email is required' : !emailRegex.test(email) ? 'Invalid email format' : '';
  const confirmPasswordError = confirmPassword !== password ? 'Passwords do not match' : '';
  const termsError = !termsAccepted ? 'You must accept the terms' : '';

  // 5 password rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%&*]/.test(password),
  };

  const allPasswordRulesMet =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecial;

  const isValid =
    fullName.length >= 2 &&
    emailRegex.test(email) &&
    allPasswordRulesMet &&
    confirmPassword === password &&
    termsAccepted;

  const handleBlur = (field: keyof TouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await signup(email, password, fullName);
      setSuccess('Account created successfully! You can now log in.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-lg border text-base outline-none transition-colors ${
      hasError ? 'border-red-500' : 'border-gray-300 focus:border-brand'
    }`;

  return (
    <Layout>
      <BackArrow to="/" />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="Enter your full name"
            className={getFieldClass(touched.fullName && !!fullNameError)}
          />
          {touched.fullName && fullNameError && (
            <p className="text-red-500 text-sm mt-1">{fullNameError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email"
            className={getFieldClass(touched.email && !!emailError)}
          />
          {touched.email && emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="Create a strong password"
              className={getFieldClass(touched.password && password.length > 0 && !allPasswordRulesMet)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <CheckItem met={passwordRules.minLength} label="At least 8 characters" />
              <CheckItem met={passwordRules.hasUpper} label="At least 1 uppercase letter (A-Z)" />
              <CheckItem met={passwordRules.hasLower} label="At least 1 lowercase letter (a-z)" />
              <CheckItem met={passwordRules.hasNumber} label="At least 1 number (0-9)" />
              <CheckItem met={passwordRules.hasSpecial} label="At least 1 special character (! @ # $ % & *)" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="Re-enter your password"
            className={getFieldClass(touched.confirmPassword && !!confirmPasswordError)}
          />
          {touched.confirmPassword && confirmPasswordError && (
            <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              onBlur={() => handleBlur('terms')}
              className="w-4 h-4 accent-brand"
            />
            <span className="text-sm text-gray-700">
              I accept the Terms & Conditions
            </span>
          </label>
          {touched.terms && !termsAccepted && (
            <p className="text-red-500 text-sm mt-1">{termsError}</p>
          )}
        </div>

        <OrangeButton type="submit" disabled={!isValid || loading}>
          {loading ? 'Creating Account...' : 'Register and Login'}
        </OrangeButton>
      </form>
    </Layout>
  );
}

function CheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <svg className="h-4 w-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>{label}</span>
    </div>
  );
}