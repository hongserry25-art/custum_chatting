
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Snippet, ToastState, User } from './types';
import { CopyIcon, EditIcon, TrashIcon, PlusIcon, FolderIcon, CheckIcon, UserIcon, LogOutIcon, MenuIcon, ExternalLinkIcon, SearchIcon, XIcon, DatabaseIcon, CloudIcon } from './components/Icons';
import { Modal } from './components/Modal';
import { Auth } from './components/Auth';

// ========================================================
// [확인됨] 사용자님이 제공해주신 최신 키를 적용했습니다.
// ========================================================
const SUPABASE_URL = 'https://ewujgwcfpzvgutuitksk.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dWpnd2NmcHp2Z3V0dWl0a3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDAzMzQsImV4cCI6MjA4MjcxNjMzNH0.y5X4ORyaV27n3w7Q-xb0zdVRNxZ7AYQCy5aR5WMTZ1s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // UI States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [snippetForm, setSnippetForm] = useState<{label: string, content: string}>({ label: '', content: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- Auth Session Check ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      }
      setIsAuthChecking(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Fetch Data from Supabase ---
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setIsDbLoading(true);
      try {
        const { data: cats, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (catError) {
          if (catError.code === '42P01') {
            showToast('SQL 에디터에서 테이블을 먼저 생성해주세요!', 'error');
          }
          throw catError;
        }

        if (cats && cats.length > 0) {
          setCategories(cats);
          setSelectedCategoryId(cats[0].id);
          
          const { data: snips, error: snipError } = await supabase
            .from('snippets')
            .select('*');
          
          if (snipError) throw snipError;
          setSnippets(snips || []);
        } else {
          // 초기 카테고리 자동 생성
          const initialNames = ['초기안내', '상담진행', '입금안내', '마무리'];
          const { data: newCats, error: createError } = await supabase
            .from('categories')
            .insert(initialNames.map(name => ({ name, user_id: currentUser.id })))
            .select();
          
          if (!createError && newCats) {
            setCategories(newCats);
            setSelectedCategoryId(newCats[0].id);
          }
        }
      } catch (err: any) {
        console.error("Data Load Error:", err);
      } finally {
        setIsDbLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredSnippets = useMemo(() => {
    let result = snippets.filter(s => s.categoryId === selectedCategoryId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.label.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    }
    return result;
  }, [snippets, selectedCategoryId, searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCategories([]);
    setSnippets([]);
    showToast('로그아웃 되었습니다.', 'info');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('복사 완료!');
    } catch (err) {
      showToast('복사 실패', 'error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !currentUser) return;
    
    setIsSyncing(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), user_id: currentUser.id })
      .select()
      .single();

    if (error) {
      showToast('저장 실패: 테이블이 생성되었는지 확인하세요.', 'error');
    } else {
      setCategories([...categories, data]);
      setNewCategoryName('');
      setSelectedCategoryId(data.id);
      showToast('카테고리 추가됨');
    }
    setIsSyncing(false);
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 카테고리와 내부 멘트를 모두 삭제할까요?')) {
      setIsSyncing(true);
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        showToast('삭제 실패', 'error');
      } else {
        setCategories(categories.filter(c => c.id !== id));
        setSnippets(snippets.filter(s => s.categoryId !== id));
        if (selectedCategoryId === id) setSelectedCategoryId(categories[0]?.id || null);
        showToast('삭제됨', 'info');
      }
      setIsSyncing(false);
    }
  };

  const handleSnippetSave = async () => {
    if (!snippetForm.content.trim() || !currentUser || !selectedCategoryId) return;
    
    setIsSyncing(true);
    if (editingSnippet) {
      const { error } = await supabase
        .from('snippets')
        .update({ label: snippetForm.label, content: snippetForm.content })
        .eq('id', editingSnippet.id);
      
      if (error) showToast('수정 실패', 'error');
      else {
        setSnippets(snippets.map(s => s.id === editingSnippet.id ? { ...editingSnippet, ...snippetForm } : s));
        showToast('수정 완료');
      }
    } else {
      const { data, error } = await supabase
        .from('snippets')
        .insert({ 
          label: snippetForm.label, 
          content: snippetForm.content, 
          categoryId: selectedCategoryId, 
          user_id: currentUser.id 
        })
        .select()
        .single();
      
      if (error) showToast('저장 실패', 'error');
      else {
        setSnippets([...snippets, data]);
        showToast('저장 완료');
      }
    }
    setIsSnippetModalOpen(false);
    setIsSyncing(false);
  };

  const handleDeleteSnippet = async (id: string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      setIsSyncing(true);
      const { error } = await supabase.from('snippets').delete().eq('id', id);
      if (error) showToast('삭제 실패', 'error');
      else {
        setSnippets(snippets.filter(s => s.id !== id));
        showToast('삭제됨', 'info');
      }
      setIsSyncing(false);
    }
  };

  if (isAuthChecking) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Auth supabase={supabase} showToast={showToast} />;

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center space-x-3 border border-white/10 ${toast.type === 'success' ? 'bg-brand' : toast.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
          <CheckIcon className="w-5 h-5" />
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/30">
              <CloudIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter">CLOUD MENT</h1>
          </div>
          <div className="flex items-center space-x-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supabase Connected</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
          {isDbLoading ? (
             <div className="py-10 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] text-slate-500">데이터 로드 중...</p>
             </div>
          ) : categories.length > 0 ? categories.map(cat => (
            <div key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setIsMobileMenuOpen(false); }}
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 ${selectedCategoryId === cat.id ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <div className="flex items-center space-x-3 overflow-hidden">
                <FolderIcon className={`w-4 h-4 ${selectedCategoryId === cat.id ? 'text-white' : 'text-slate-600'}`} />
                <span className="text-sm font-bold truncate">{cat.name}</span>
              </div>
              <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-opacity">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )) : (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-600">SQL 테이블을 먼저 생성해주세요.</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/40">
           <form onSubmit={handleAddCategory} className="flex space-x-2 mb-4">
              <input type="text" placeholder="새 카테고리" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand" />
              <button type="submit" className="p-2 bg-brand text-white rounded-lg"><PlusIcon className="w-4 h-4" /></button>
           </form>

           <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
             <div className="flex items-center space-x-3 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-brand font-black">
                 {currentUser.email[0].toUpperCase()}
               </div>
               <div className="flex flex-col truncate">
                 <span className="text-xs font-bold text-white truncate">{currentUser.email.split('@')[0]}</span>
                 <span className="text-[9px] text-slate-500">Cloud Synced</span>
               </div>
             </div>
             <button onClick={handleLogout} className="p-2 text-slate-600 hover:text-red-400 transition-all"><LogOutIcon className="w-4 h-4" /></button>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        <header className="px-6 md:px-10 py-8 flex items-center justify-between gap-4">
          <div className="flex items-center">
            <button className="md:hidden mr-4 p-2 bg-slate-800 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-white">{activeCategory?.name || '멘트 관리'}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="멘트 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-brand/40 outline-none w-64" />
            </div>
            <button onClick={() => { setEditingSnippet(null); setSnippetForm({label:'', content:''}); setIsSnippetModalOpen(true); }} className="px-6 py-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/30 font-bold transform active:scale-95 transition-all">추가</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 custom-scrollbar">
          {filteredSnippets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSnippets.map(snip => (
                <div key={snip.id} className="group relative bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-brand/30 rounded-3xl p-6 transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-black text-slate-300">{snip.label}</span>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingSnippet(snip); setSnippetForm({label:snip.label, content:snip.content}); setIsSnippetModalOpen(true); }} className="p-1.5 hover:text-brand"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteSnippet(snip.id)} className="p-1.5 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div onClick={() => copyToClipboard(snip.content)} className="cursor-pointer">
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-4 mb-4 whitespace-pre-wrap">{snip.content}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                       <span className="text-[10px] font-black text-brand uppercase">Click to copy</span>
                       <CopyIcon className="w-4 h-4 text-brand" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
               <DatabaseIcon className="w-20 h-20 mb-4" />
               <p className="text-xl font-bold">비어있음</p>
               <p className="text-sm mt-2 text-center text-slate-400">카테고리를 선택하거나<br/>우측 상단 '추가' 버튼을 눌러보세요.</p>
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={isSnippetModalOpen} onClose={() => setIsSnippetModalOpen(false)} title={editingSnippet ? '멘트 수정' : '새 멘트 추가'}>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Label</label>
            <input type="text" value={snippetForm.label} onChange={e => setSnippetForm({...snippetForm, label: e.target.value})} placeholder="예: 첫 인사"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-brand outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Content</label>
            <textarea value={snippetForm.content} onChange={e => setSnippetForm({...snippetForm, content: e.target.value})} placeholder="메시지 내용..." rows={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-brand outline-none resize-none" />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button onClick={() => setIsSnippetModalOpen(false)} className="px-8 font-bold text-slate-500">취소</button>
            <button onClick={handleSnippetSave} className="px-12 py-4 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/30">저장</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
