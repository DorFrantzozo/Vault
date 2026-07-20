import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShieldCheck, Lock, User, ArrowLeft, Sparkles, UserPlus } from 'lucide-react';
import { useLoginMutation, useRegisterMutation } from '../store/api/authApi.js';
import { setCredentials } from '../store/slices/authSlice.js';

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = isLoginLoading || isRegisterLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (isRegisterMode) {
        const res = await register({ username, password }).unwrap();
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        navigate('/dashboard');
      } else {
        const res = await login({ username, password }).unwrap();
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'התחברות נכשלה. אנא בדוק את הפרטים שהזנת.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-['Heebo',sans-serif]">
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white shadow-sm mb-3">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">מערכת ניהול כספים ותפעול</h1>
          <p className="text-zinc-400 text-xs mt-1">אזור ניהול פנימי מאובטח</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center space-x-2 space-x-reverse text-xs font-semibold uppercase tracking-wider text-zinc-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{isRegisterMode ? 'הגדרת חשבון מנהל ראשוני' : 'אימות מנהל המערכת'}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">שם משתמש</label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">סיסמה</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pr-9 pl-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all text-right"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse text-xs disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>צור חשבון מנהל</span>
                </>
              ) : (
                <>
                  <span>כניסה למערכת</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors"
            >
              {isRegisterMode
                ? 'כבר יצרת חשבון? לחץ למעבר להתחברות'
                : 'פעם ראשונה במערכת? לחץ ליצירת חשבון מנהל ראשוני'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-500 mt-6">
          סשן מוצפן ללא מצב • אבטחת עוגיות HttpOnly
        </p>
      </div>
    </div>
  );
}
