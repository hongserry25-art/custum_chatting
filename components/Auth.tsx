import React, { useState } from 'react';
import { MailIcon, LockIcon, UserIcon, CheckIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY_USERS = 'chat_helper_users';

export const Auth: React.FC<AuthProps> = ({ onLogin, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('이메일과 비밀번호를 모두 입력해주세요.', 'error');
      return;
    }

    // Get existing users
    const storedUsersString = localStorage.getItem(STORAGE_KEY_USERS);
    const storedUsers: User[] = storedUsersString ? JSON.parse(storedUsersString) : [];

    if (isLogin) {
      // Login Logic
      const foundUser = storedUsers.find(u => u.email === email && u.password === password);
      if (foundUser) {
        onLogin(foundUser);
        showToast(`환영합니다, ${foundUser.email}님!`);
      } else {
        showToast('이메일 또는 비밀번호가 일치하지 않습니다.', 'error');
      }
    } else {
      // Register Logic
      if (password !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
        return;
      }
      if (storedUsers.find(u => u.email === email)) {
        showToast('이미 등록된 이메일입니다.', 'error');
        return;
      }

      const newUser: User = { email, password };
      const updatedUsers = [...storedUsers, newUser];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      
      onLogin(newUser);
      showToast('회원가입이 완료되었습니다!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/20 text-brand mb-4">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">채팅 멘트 도우미</h1>
          <p className="text-slate-400">
            {isLogin ? '계정에 로그인하여 멘트를 관리하세요.' : '새로운 계정을 만들고 시작하세요.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${isLogin ? 'bg-slate-800 text-brand border-b-2 border-brand' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
            >
              로그인
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${!isLogin ? 'bg-slate-800 text-brand border-b-2 border-brand' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
            >
              회원가입
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">이메일</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-sm font-medium text-slate-300">비밀번호 확인</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand focus:ring-offset-slate-900 transition-all"
            >
              {isLogin ? '로그인하기' : '회원가입하고 시작하기'}
            </button>
          </form>
        </div>
        
        <p className="mt-6 text-center text-xs text-slate-500">
          이 앱은 브라우저 저장소(LocalStorage)를 사용하여<br/>데이터를 안전하게 보관합니다.
        </p>
      </div>
    </div>
  );
};