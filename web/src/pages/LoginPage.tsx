import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { AuroraBackground } from '../components/glass/AuroraBackground';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassInput } from '../components/glass/GlassInput';
import { GlassButton } from '../components/glass/GlassButton';
import { User as UserIcon, Lock, Eye, EyeOff, Sparkles, AlertCircle, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { vi } from '../i18n/vi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [username, setUsername] = useState('taitv');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regUsername.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await register(regUsername.trim(), regPassword, regFullName.trim() || regUsername.trim());
      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Đăng ký tài khoản thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto relative flex items-center justify-center p-4 selection:bg-[#E27AA1]/30 selection:text-[#3B2A33]">
      {/* Dynamic Aurora fluid background */}
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.9 }}
        className="w-full max-w-[420px] my-auto"
      >
        <GlassCard variant="strong" className="p-7 sm:p-9 rounded-[24px] shadow-xl">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#E27AA1] to-[#F8C8DC] flex items-center justify-center text-white shadow-md shadow-[#E27AA1]/25 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 data-role="page-title" className="text-[1.375rem] leading-[1.875rem] font-semibold tracking-tight text-[#2C1E26] dark:text-[#FFFFFF]">
              {vi.app.name}
            </h1>
            <p data-role="caption" className="text-[0.8125rem] leading-[1.125rem] text-[#68515E] dark:text-[#D8C9D2] mt-0.5 font-normal">
              {vi.login.subtitle}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-xl bg-gray-100 dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] grid grid-cols-2 gap-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#2A2A3A] text-[#2C1E26] dark:text-[#FFFFFF] shadow-xs'
                  : 'text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{vi.nav.login}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#2A2A3A] text-[#2C1E26] dark:text-[#FFFFFF] shadow-xs'
                  : 'text-[#68515E] dark:text-[#D8C9D2] hover:text-[#2C1E26] dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký tài khoản</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-[#E11D48] font-normal"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.75px]" />
              <span data-role="caption">{error}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-normal"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.75px]" />
              <span data-role="caption">{successMsg}</span>
            </motion.div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
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
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:text-[#2C1E26] dark:hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? vi.login.hidePassword : vi.login.showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 stroke-[1.75px]" /> : <Eye className="w-4 h-4 stroke-[1.75px]" />}
                  </button>
                }
                placeholder={vi.login.passwordPlaceholder}
              />

              <div className="mt-2">
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-xs text-[#E27AA1] dark:text-[#F092B5] hover:underline cursor-pointer"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <GlassInput
                label="Họ và tên"
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 stroke-[1.75px]" />}
                placeholder="Ví dụ: Nguyễn Văn A"
              />

              <GlassInput
                label={vi.login.username}
                type="text"
                required
                autoFocus
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 stroke-[1.75px]" />}
                placeholder="Chọn tên đăng nhập..."
              />

              <GlassInput
                label={vi.login.password}
                type={showRegPassword ? 'text' : 'password'}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:text-[#2C1E26] dark:hover:text-white transition-colors cursor-pointer"
                    aria-label={showRegPassword ? vi.login.hidePassword : vi.login.showPassword}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4 stroke-[1.75px]" /> : <Eye className="w-4 h-4 stroke-[1.75px]" />}
                  </button>
                }
                placeholder="Tối thiểu 6 ký tự..."
              />

              <GlassInput
                label="Xác nhận mật khẩu"
                type={showRegPassword ? 'text' : 'password'}
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 stroke-[1.75px]" />}
                placeholder="Nhập lại mật khẩu..."
              />

              <div className="mt-2">
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full font-medium shadow-md shadow-[#E27AA1]/25"
                >
                  Tạo tài khoản & Bắt đầu
                </GlassButton>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs text-[#E27AA1] dark:text-[#F092B5] hover:underline cursor-pointer"
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#262634] text-center">
            <p data-role="caption" className="text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2] font-normal">
              {vi.app.version} · Hoạt động ngoại tuyến cục bộ 100%
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
