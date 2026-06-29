import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await signup(name, email, password);
      toast.success('Account created! Welcome to VeoLMS!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#6C47FF] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Veo<span className="text-[#6C47FF]">LMS</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-1">Create your account</h1>
          <p className="text-[#9B98B8] text-sm">Start learning for free today</p>
        </div>

        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                placeholder="Aryan Barde"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map(({ label, valid }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${valid ? 'text-green-400' : 'text-[#9B98B8]'}`}>
                      <Check className={`w-3 h-3 ${valid ? 'text-green-400' : 'text-[#2E2E4A]'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#6C47FF] hover:bg-[#5234DB] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-[#9B98B8] mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-[#9B98B8] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6C47FF] hover:text-[#8B6FFF] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
