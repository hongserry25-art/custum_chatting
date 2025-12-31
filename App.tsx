import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Category, Snippet, ToastState, User } from './types';
import { CopyIcon, EditIcon, TrashIcon, PlusIcon, FolderIcon, CheckIcon, UserIcon, LogOutIcon, MenuIcon, ExternalLinkIcon, SearchIcon, XIcon } from './components/Icons';
import { Modal } from './components/Modal';
import { Auth } from './components/Auth';

// --- Constants & Defaults ---
const STORAGE_KEY_CURRENT_USER = 'chat_helper_current_user';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '초기안내' },
  { id: 'cat-2', name: '상담진행' },
  { id: 'cat-3', name: '입금안내' },
  { id: 'cat-4', name: '마무리' },
];

const DEFAULT_SNIPPETS: Snippet[] = [
  { 
    id: 'snip-1', 
    categoryId: 'cat-1', 
    label: '서비스 소개', 
    content: '저희 서비스는 24시간 운영되며, 언제든지 문의가 가능합니다. 아래 메뉴에서 원하시는 항목을 선택해주세요.' 
  },
  { 
    id: 'snip-2', 
    categoryId: 'cat-1', 
    label: '첫 인사', 
    content: '안녕하세요! 찾아주셔서 감사합니다. 무엇을 도와드릴까요?' 
  },
  { 
    id: 'snip-3', 
    categoryId: 'cat-3', 
    label: '계좌 정보', 
    content: '국민은행 000-000000-00-000 예금주: 홍길동' 
  },
];

const EXTERNAL_LINKS = [
  { name: '사주이론', url: 'https://care-book-one.vercel.app' },
  { name: '포스텔러 만세력', url: 'https://pro.forceteller.com/profile/edit' },
  { name: '사주비즈랩', url: 'https://www.sajulab.kr' },
  { name: '만능답변기', url: 'https://chatgpt.com/g/g-693357ce305c8191b397c43d47f4af64-karaban-manneung-jilmundabbyeongi' },
  { name: '만능궁합', url: 'https://chatgpt.com/g/g-6933589e04e88191aabeeaba96aff9ce-karaban-wanbyeog-gunghabbunseoggi' },
  { name: '친절모드 답변', url: 'https://chatgpt.com/g/g-6934093e3694819199b17174399a85de-cinjeolmodeuro-dabbyeon' },
];

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- App State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [snippetForm, setSnippetForm] = useState<{label: string, content: string}>({ label: '', content: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState<Set<string>>(new Set());
  
  // Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helper: Dynamic Keys ---
  const getCategoriesKey = (email: string) => `chat_helper_categories_${email}`;
  const getSnippetsKey = (email: string) => `chat_helper_snippets_${email}`;

  // --- Helper: Toast ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- Effects ---
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCategories([]);
      setSnippets([]);
      return;
    }

    const catKey = getCategoriesKey(currentUser.email);
    const snipKey = getSnippetsKey(currentUser.email);

    const loadedCats = localStorage.getItem(catKey);
    const loadedSnips = localStorage.getItem(snipKey);

    if (loadedCats) {
      const parsedCats = JSON.parse(loadedCats);
      setCategories(parsedCats);
      if (parsedCats.length > 0) setSelectedCategoryId(parsedCats[0].id);
    } else {
      setCategories(DEFAULT_CATEGORIES);
      setSelectedCategoryId(DEFAULT_CATEGORIES[0].id);
      localStorage.setItem(catKey, JSON.stringify(DEFAULT_CATEGORIES));
    }

    if (loadedSnips) {
      setSnippets(JSON.parse(loadedSnips));
    } else {
      setSnippets(DEFAULT_SNIPPETS);
      localStorage.setItem(snipKey, JSON.stringify(DEFAULT_SNIPPETS));
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && categories.length > 0) {
      localStorage.setItem(getCategoriesKey(currentUser.email), JSON.stringify(categories));
    }
  }, [categories, currentUser]);

  useEffect(() => {
    if (currentUser && snippets.length > 0) {
      localStorage.setItem(getSnippetsKey(currentUser.email), JSON.stringify(snippets));
    }
  }, [snippets, currentUser]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Search & Filter Logic ---
  const filteredSnippets = useMemo(() => {
    let result = snippets.filter(s => s.categoryId === selectedCategoryId);
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.label.toLowerCase().includes(lowerQuery) || 
        s.content.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [snippets, selectedCategoryId, searchQuery]);

  // --- Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    showToast('로그아웃 되었습니다.', 'info');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('텍스트가 복사되었습니다!');
    } catch (err) {
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const newCat: Category = { id: uuidv4(), name: newCategoryName.trim() };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setSelectedCategoryId(newCat.id); 
    showToast('새 카테고리가 추가되었습니다.');
  };

  const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 카테고리를 삭제하시겠습니까? 포함된 모든 멘트도 삭제됩니다.')) {
      setCategories(categories.filter(c => c.id !== id));
      setSnippets(snippets.filter(s => s.categoryId !== id));
      if (selectedCategoryId === id) {
        setSelectedCategoryId(categories.length > 1 ? categories.find(c => c.id !== id)?.id || null : null);
      }
      showToast('카테고리가 삭제되었습니다.', 'info');
    }
  };

  const handleEditCategoryStart = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
  };

  const handleEditCategorySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
    showToast('카테고리가 수정되었습니다.');
  };

  const openAddSnippetModal = () => {
    setEditingSnippet(null);
    setSnippetForm({ label: '', content: '' });
    setIsSnippetModalOpen(true);
  };

  const openEditSnippetModal = (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSnippet(snippet);
    setSnippetForm({ label: snippet.label, content: snippet.content });
    setIsSnippetModalOpen(true);
  };

  const handleSnippetSave = () => {
    if (!snippetForm.content.trim()) {
      showToast('내용을 입력해주세요.', 'error');
      return;
    }
    if (editingSnippet) {
      const updatedSnippet = { ...editingSnippet, ...snippetForm };
      setSnippets(snippets.map(s => s.id === editingSnippet.id ? updatedSnippet : s));
      showToast('멘트가 수정되었습니다.');
    } else {
      if (!selectedCategoryId) return;
      const newSnippet: Snippet = { id: uuidv4(), categoryId: selectedCategoryId, ...snippetForm };
      setSnippets([...snippets, newSnippet]);
      showToast('새 멘트가 추가되었습니다.');
    }
    setIsSnippetModalOpen(false);
  };

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 멘트를 삭제하시겠습니까?')) {
      setSnippets(snippets.filter(s => s.id !== id));
      showToast('멘트가 삭제되었습니다.', 'info');
    }
  };

  const handleDuplicateSnippet = (snippet: Snippet, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSnippet: Snippet = { ...snippet, id: uuidv4(), label: `${snippet.label} (복사본)` };
    setSnippets([...snippets, newSnippet]);
    showToast('멘트가 복제되었습니다.');
  };

  const toggleSnippetExpansion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedSnippets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSnippets(newSet);
  };

  // --- Backup & Restore ---
  const exportData = () => {
    const data = {
      categories,
      snippets,
      exportDate: new Date().toISOString(),
      user: currentUser?.email
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-helper-backup-${new Date().toLocaleDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('데이터가 파일로 저장되었습니다.');
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.categories && json.snippets) {
          if (window.confirm('현재 데이터를 덮어쓰고 백업 데이터를 불러올까요?')) {
            setCategories(json.categories);
            setSnippets(json.snippets);
            if (json.categories.length > 0) setSelectedCategoryId(json.categories[0].id);
            showToast('데이터 복구가 완료되었습니다.');
          }
        } else {
          showToast('올바른 백업 파일이 아닙니다.', 'error');
        }
      } catch (err) {
        showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!currentUser) {
    return (
      <>
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center space-x-2 
            ${toast.type === 'success' ? 'bg-brand text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
        <Auth onLogin={handleLogin} showToast={showToast} />
      </>
    );
  }

  const activeCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center space-x-2 
          ${toast.type === 'success' ? 'bg-brand text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
          {toast.type === 'success' && <CheckIcon className="w-5 h-5"/>}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950/95 backdrop-blur-xl md:backdrop-blur-none md:bg-slate-950/50 border-r border-slate-800 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent mb-1">카테고리</h1>
          <p className="text-xs text-slate-500 font-light">나만의 멘트 보관함</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {categories.map(category => (
            <div key={category.id} onClick={() => { setSelectedCategoryId(category.id); setIsMobileMenuOpen(false); setSearchQuery(''); }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedCategoryId === category.id ? 'bg-brand shadow-md shadow-brand/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              {editingCategory?.id === category.id ? (
                <form onSubmit={handleEditCategorySave} className="flex-1 flex items-center" onClick={e => e.stopPropagation()}>
                  <input autoFocus type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} onBlur={() => setEditingCategory(null)}
                    className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm outline-none border border-brand" />
                  <button type="submit" className="ml-2 text-brand hover:text-brand-dark"><CheckIcon className="w-4 h-4" /></button>
                </form>
              ) : (
                <>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FolderIcon className={`w-5 h-5 flex-shrink-0 ${selectedCategoryId === category.id ? 'text-white' : 'text-slate-600 group-hover:text-slate-500'}`} />
                    <span className="font-medium truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditCategoryStart(category, e)} className="p-1 hover:bg-white/10 rounded"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => handleDeleteCategory(category.id, e)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="mb-4 pb-4 border-b border-slate-800 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
             {EXTERNAL_LINKS.map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand hover:text-brand-dark transition-all border border-slate-700 hover:border-brand/30 shadow-sm group">
                  <span className="font-semibold text-sm">{link.name}</span>
                  <ExternalLinkIcon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </a>
             ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
             <button onClick={exportData} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 py-1.5 rounded-md transition-colors border border-slate-700">백업하기</button>
             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 py-1.5 rounded-md transition-colors border border-slate-700">복원하기</button>
             <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
          </div>

          <form onSubmit={handleAddCategory} className="flex space-x-2 mb-4">
            <input type="text" placeholder="새 카테고리" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-brand/50 border border-slate-700 placeholder-slate-600" />
            <button type="submit" disabled={!newCategoryName.trim()} className="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors shadow-lg shadow-brand/20">
              <PlusIcon className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 overflow-hidden">
               <div className="bg-brand/20 p-1.5 rounded-full text-brand"><UserIcon className="w-4 h-4" /></div>
               <div className="text-sm text-slate-300 truncate font-medium">{currentUser.email.split('@')[0]}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-md" title="로그아웃">
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
        <header className="px-4 md:px-8 py-6 border-b border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <button className="mr-3 md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">
              {activeCategory ? activeCategory.name : '멘트 보관함'}
            </h2>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            {activeCategory && (
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <input type="text" placeholder="멘트 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-brand/50 outline-none transition-all" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {activeCategory && (
              <button onClick={openAddSnippetModal}
                className="flex-shrink-0 flex items-center space-x-2 bg-brand hover:bg-brand-dark text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 font-medium text-sm">
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">추가</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {activeCategory ? (
            filteredSnippets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {filteredSnippets.map(snippet => {
                  const isExpanded = expandedSnippets.has(snippet.id);
                  const isLongContent = snippet.content.length > 200 || snippet.content.split('\n').length > 5;
                  return (
                    <div key={snippet.id} className="group relative flex flex-col bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand/40 rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${['bg-pink-400', 'bg-cyan-400', 'bg-indigo-400', 'bg-amber-400'][snippet.label.length % 4]}`}></span>
                          <span className="text-sm font-bold text-slate-200 truncate">{snippet.label}</span>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handleDuplicateSnippet(snippet, e)} className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-md" title="복제"><CopyIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => openEditSnippetModal(snippet, e)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md" title="수정"><EditIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => handleDeleteSnippet(snippet.id, e)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md" title="삭제"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <div onClick={() => copyToClipboard(snippet.content)} className="p-5 flex-1 cursor-pointer flex flex-col group/content">
                        <div className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-normal ${isExpanded ? '' : 'line-clamp-6'}`}>
                          {snippet.content}
                        </div>
                        {isLongContent && (
                          <button onClick={(e) => toggleSnippetExpansion(snippet.id, e)} className="mt-2 text-brand text-xs font-semibold hover:underline w-fit">
                            {isExpanded ? '접기' : '더보기...'}
                          </button>
                        )}
                        <div className="mt-4 flex items-center text-brand text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover/content:opacity-100 transition-opacity">
                          <CopyIcon className="w-3 h-3 mr-1" /> Click to copy
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  {searchQuery ? <SearchIcon className="w-10 h-10 text-slate-600" /> : <PlusIcon className="w-10 h-10 text-slate-600" />}
                </div>
                <p className="text-xl font-medium text-slate-400">{searchQuery ? '검색 결과가 없습니다' : '등록된 멘트가 없습니다'}</p>
                <p className="text-sm mt-2 font-light">{searchQuery ? '다른 검색어를 입력해보세요.' : '첫 번째 멘트를 추가하여 시작해보세요!'}</p>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
               <FolderIcon className="w-16 h-16 mb-4 opacity-20" />
               <p className="text-lg font-medium">선택된 카테고리가 없습니다</p>
               <p className="text-sm mt-1 font-light">카테고리를 선택하거나 새로 만들어보세요.</p>
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={isSnippetModalOpen} onClose={() => setIsSnippetModalOpen(false)} title={editingSnippet ? '멘트 수정' : '새 멘트 추가'}>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">구분 (Label)</label>
            <input type="text" value={snippetForm.label} onChange={(e) => setSnippetForm({...snippetForm, label: e.target.value})} placeholder="예: 입금 계좌안내, 첫 인사"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all placeholder-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">내용 (Content)</label>
            <textarea value={snippetForm.content} onChange={(e) => setSnippetForm({...snippetForm, content: e.target.value})} placeholder="고객에게 전송할 메시지 내용을 입력하세요..." rows={8}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all placeholder-slate-600 resize-none leading-relaxed" />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button onClick={() => setIsSnippetModalOpen(false)} className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">취소</button>
            <button onClick={handleSnippetSave} className="px-8 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-bold shadow-lg shadow-brand/40 transition-all transform active:scale-95">저장하기</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;