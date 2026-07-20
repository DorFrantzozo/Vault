import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {useLoginMutation, useRegisterMutation} from "../store/api/authApi.js";
import {setCredentials} from "../store/slices/authSlice.js";

import {Card} from "../components/ui/card";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [login, {isLoading: isLoginLoading}] = useLoginMutation();
  const [register, {isLoading: isRegisterLoading}] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = isLoginLoading || isRegisterLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (isRegisterMode) {
        const res = await register({username, password}).unwrap();
        dispatch(setCredentials({user: res.data.user, token: res.data.token}));
        navigate("/dashboard");
      } else {
        const res = await login({username, password}).unwrap();
        dispatch(setCredentials({user: res.data.user, token: res.data.token}));
        navigate("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || "התחברות נכשלה. אנא בדוק את הפרטים שהזנת.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-canvas-cream text-[ink-black] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-lifted-cream border border-[ink-black]/10 rounded-2xl text-[ink-black] shadow-xs mb-3">
            <ShieldCheck className="w-7 h-7 text-[#CF4500]" />
          </div>
          <h1 className="text-3xl font-medium text-[ink-black] tracking-tight font-heading">
            מערכת ניהול כספים ותפעול
          </h1>
          <p className="text-[slate-gray] text-xs mt-1">
            אזור ניהול פנימי מאובטח
          </p>
        </div>

        <Card className="p-7 space-y-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between border-b border-[ink-black]/10 pb-3">
            <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold uppercase tracking-wider text-[ink-black] font-heading">
              <Sparkles className="w-4 h-4 text-[#CF4500]" />
              <span>
                {isRegisterMode
                  ? "הגדרת חשבון מנהל ראשוני"
                  : "אימות מנהל המערכת"}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#CF4500]/10 border border-[#CF4500]/20 text-[#CF4500] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] uppercase tracking-wider mb-1 font-heading">
                שם משתמש
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[slate-gray] z-10" />
                <Input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name"
                  className="pr-11 text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] uppercase tracking-wider mb-1 font-heading">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[slate-gray] z-10" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11 text-right"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="w-full mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4 ml-2" />
                  <span>צור חשבון מנהל</span>
                </>
              ) : (
                <>
                  <span>כניסה למערכת</span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-[ink-black]/10 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg("");
              }}
              className="text-xs text-[slate-gray] hover:text-[ink-black] font-semibold transition-colors"
            >
              {isRegisterMode
                ? "כבר יצרת חשבון? לחץ למעבר להתחברות"
                : "פעם ראשונה במערכת? לחץ ליצירת חשבון מנהל ראשוני"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
