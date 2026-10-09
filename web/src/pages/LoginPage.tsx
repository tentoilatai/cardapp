import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AuroraBackground } from '../components/glass/AuroraBackground';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassButton } from '../components/glass/GlassButton';
import { User as UserIcon, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { vi } from '../i18n/vi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('taitv');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loggedUser = await login(username, password);
      if (loggedUser.mustChangePassword) {
        navigate('/');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || vi.login.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden relative flex items-center justify-center p-4 selection:bg-[#E27AA1]/30 selection:text-[#3B2A33]">
      {/* Dynamic Aurora fluid blobs background */}
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.9 }}
        className="w-full max-w-[400px]"
      >
        <GlassCard variant="strong" className="p-8 sm:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(214,110,150,0.22)]">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E27AA1] to-[#F8C8DC] flex items-center justify-center text-white shadow-lg shadow-[#E27AA1]/30 mb-3.5 hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 data-role="page-title" className="text-[1.5rem] leading-[2rem] font-semibold tracking-tight text-[#2C1E26] dark:text-[#FFFFFF]">
              {vi.app.name}
            </h1>
            <p data-role="caption" className="text-[0.8125rem] leading-[1.125rem] text-[#68515E] dark:text-[#D8C9D2] mt-1 font-normal">
              {vi.login.subtitle}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-[#E11D48]/12 border border-[#E11D48]/25 flex items-start gap-2.5 text-[0.75rem] leading-[1rem] text-[#E11D48] font-normal"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.75px]" />
              <span data-role="caption">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <GlassInput
              label={vi.login.username}
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4 stroke-[1.75px]" />}
              placeholder={vi.login.usernamePlaceholder}
            />

            <GlassInput
              label={vi.login.password}
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:text-[#2C1E26] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={showPassword ? vi.login.hidePassword : vi.login.showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 stroke-[1.75px]" /> : <Eye className="w-4 h-4 stroke-[1.75px]" />}
                </button>
              }
              placeholder={vi.login.passwordPlaceholder}
            />

            <div className="mt-3">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-medium shadow-md shadow-[#E27AA1]/25"
              >
                {vi.nav.login}
              </GlassButton>
            </div>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-5 border-t border-black/5 dark:border-white/10 text-center">
            <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] font-normal">
              {vi.app.version} · {vi.auth.passwordHint.slice(0, 36)}...
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
