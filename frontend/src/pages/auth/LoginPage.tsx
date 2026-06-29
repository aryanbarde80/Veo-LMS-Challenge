import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      navigate(user?.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#6C47FF] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Veo<span className="text-[#6C47FF]">LMS</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Welcome back</h1>
          <p className="text-[#9B98B8] text-sm">Sign in to continue learning</p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B98B8] hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#6C47FF] hover:bg-[#5234DB] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-[#0F0F1A] rounded-xl border border-[#2E2E4A]">
            <p className="text-xs text-[#9B98B8] font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-[#9B98B8]">
              <p>👨‍💼 Admin: <span className="text-white">admin@veolms.com</span> / <span className="text-white">Admin@123456</span></p>
              <p>🎓 Student: <span className="text-white">student@veolms.com</span> / <span className="text-white">Student@123456</span></p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#9B98B8] mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#6C47FF] hover:text-[#8B6FFF] font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
