import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { MailIcon, LockIcon, UserIcon, CheckIcon } from './Icons';

interface AuthProps {
  supabase: SupabaseClient;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Auth: React.FC<AuthProps> = ({ supabase, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('로그인 성공!');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('회원가입 성공! 이메일을 확인하거나 로그인하세요.');
      }
    } catch (err: any) {
      showToast(err.message || '인증 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand/10 text-brand mb-6 shadow-2xl shadow-brand/10">
            <UserIcon className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">CLOUD MENT</h1>
          <p className="text-slate-500 font-medium">실시간 동기화 채팅 멘트 관리 솔루션</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="flex p-2 bg-slate-950/50 m-4 rounded-2xl">
            <button onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${isLogin ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              로그인
            </button>
            <button onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${!isLogin ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
              <div className="relative group">
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand transition-colors" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  placeholder="example@mail.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative group">
                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand transition-colors" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                  placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-5 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black shadow-xl shadow-brand/20 transition-all transform active:scale-[0.98] disabled:opacity-50">
              {loading ? '처리 중...' : (isLogin ? '로그인하기' : '지금 시작하기')}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Powered by Supabase Cloud
        </p>
      </div>
    </div>
  );
};