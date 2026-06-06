import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import OrangeButton from '../components/OrangeButton';
import { isAuthenticated, login } from '../lib/backendApi';

interface TouchedState {
  email: boolean;
  password: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<TouchedState>({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailError = !email ? 'Email is required' : !emailRegex.test(email) ? 'Invalid email format' : '';
  const passwordError = !password ? 'Password is required' : password.length < 6 ? 'Password must be at least 6 characters' : '';

  const isValid = emailRegex.test(email) && password.length >= 6;

  const handleBlur = (field: keyof TouchedState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Logo />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email"
            className={`w-full px-4 py-3 rounded-lg border text-base outline-none transition-colors ${
              touched.email && emailError ? 'border-red-500' : 'border-gray-300 focus:border-brand'
            }`}
          />
          {touched.email && emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Enter your password"
            className={`w-full px-4 py-3 rounded-lg border text-base outline-none transition-colors ${
              touched.password && passwordError ? 'border-red-500' : 'border-gray-300 focus:border-brand'
            }`}
          />
          {touched.password && passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>

        <OrangeButton type="submit" disabled={!isValid || loading}>
          {loading ? 'Logging in...' : 'Login'}
        </OrangeButton>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Not a member?{' '}
        <Link to="/register" className="text-brand font-medium hover:underline">
          Register here
        </Link>
      </p>
    </Layout>
  );
}
