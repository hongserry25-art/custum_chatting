import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Category, Snippet, ToastState, User } from './types';
import { CopyIcon, EditIcon, TrashIcon, PlusIcon, FolderIcon, CheckIcon, UserIcon, LogOutIcon, MenuIcon } from './components/Icons';
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

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- App State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // UI States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [snippetForm, setSnippetForm] = useState<{label: string, content: string}>({ label: '', content: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  // --- Helper: Dynamic Keys ---
  const getCategoriesKey = (email: string) => `chat_helper_categories_${email}`;
  const getSnippetsKey = (email: string) => `chat_helper_snippets_${email}`;

  // --- Helper: Toast ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- Effects ---

  // 1. Initial Load: Check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Load Data when User Changes
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
      // Initialize with defaults for new users
      setCategories(DEFAULT_CATEGORIES);
      setSelectedCategoryId(DEFAULT_CATEGORIES[0].id);
      localStorage.setItem(catKey, JSON.stringify(DEFAULT_CATEGORIES));
    }

    if (loadedSnips) {
      setSnippets(JSON.parse(loadedSnips));
    } else {
      // Initialize with defaults for new users
      setSnippets(DEFAULT_SNIPPETS);
      localStorage.setItem(snipKey, JSON.stringify(DEFAULT_SNIPPETS));
    }
  }, [currentUser]);

  // 3. Save Data Changes
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

  // Toast Timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  // --- Category Handlers ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const newCat: Category = {
      id: uuidv4(),
      name: newCategoryName.trim()
    };
    
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

  // --- Snippet Handlers ---
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
      // Update
      const updatedSnippet = { ...editingSnippet, ...snippetForm };
      setSnippets(snippets.map(s => s.id === editingSnippet.id ? updatedSnippet : s));
      showToast('멘트가 수정되었습니다.');
    } else {
      // Create
      if (!selectedCategoryId) return;
      const newSnippet: Snippet = {
        id: uuidv4(),
        categoryId: selectedCategoryId,
        ...snippetForm
      };
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
    const newSnippet: Snippet = {
      ...snippet,
      id: uuidv4(),
      label: `${snippet.label} (복사본)`
    };
    setSnippets([...snippets, newSnippet]);
    showToast('멘트가 복제되었습니다.');
  };

  // --- Render ---

  // 1. If not logged in, show Auth Screen
  if (!currentUser) {
    return (
      <>
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center space-x-2 
            ${toast.type === 'success' ? 'bg-brand text-white' : 
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
            <span className="font-medium">{toast.message}</span>
          </div>
        )}
        <Auth onLogin={handleLogin} showToast={showToast} />
      </>
    );
  }

  // 2. Main App (Logged In)
  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const activeSnippets = snippets.filter(s => s.categoryId === selectedCategoryId);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center space-x-2 
          ${toast.type === 'success' ? 'bg-brand text-white' : 
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}`}>
          {toast.type === 'success' && <CheckIcon className="w-5 h-5"/>}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Categories */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-950/95 backdrop-blur-xl md:backdrop-blur-none md:bg-slate-950/50 border-r border-slate-800 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent mb-1">
            카테고리
          </h1>
          <p className="text-xs text-slate-500">멘트를 카테고리별로 관리하세요.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {categories.map(category => (
            <div 
              key={category.id} 
              onClick={() => {
                setSelectedCategoryId(category.id);
                setIsMobileMenuOpen(false);
              }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 
                ${selectedCategoryId === category.id 
                  ? 'bg-brand shadow-md shadow-brand/20 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              {editingCategory?.id === category.id ? (
                // Edit Mode
                <form onSubmit={handleEditCategorySave} className="flex-1 flex items-center" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    onBlur={() => setEditingCategory(null)}
                    className="w-full bg-slate-700 text-white px-2 py-1 rounded text-sm outline-none border border-brand"
                  />
                  <button type="submit" className="ml-2 text-brand hover:text-brand-dark"><CheckIcon className="w-4 h-4" /></button>
                </form>
              ) : (
                // View Mode
                <>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FolderIcon className={`w-5 h-5 flex-shrink-0 ${selectedCategoryId === category.id ? 'text-white' : 'text-slate-600 group-hover:text-slate-500'}`} />
                    <span className="font-medium truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditCategoryStart(category, e)} className="p-1 hover:bg-white/10 rounded">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDeleteCategory(category.id, e)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <form onSubmit={handleAddCategory} className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="새 카테고리"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-slate-800 text-slate-200 text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-brand/50 border border-slate-700 placeholder-slate-600"
            />
            <button 
              type="submit"
              disabled={!newCategoryName.trim()}
              className="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors shadow-lg shadow-brand/20"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </form>

          {/* User Profile / Logout */}
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 overflow-hidden">
               <div className="bg-brand/20 p-1.5 rounded-full text-brand">
                 <UserIcon className="w-4 h-4" />
               </div>
               <div className="text-sm text-slate-300 truncate font-medium">
                 {currentUser.email.split('@')[0]}
               </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-md"
              title="로그아웃"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
        
        {/* Header */}
        <header className="px-4 md:px-8 py-6 border-b border-slate-800 bg-slate-900 flex justify-between items-end">
          <div className="flex items-start md:items-end flex-col md:flex-row gap-2 md:gap-0 w-full md:w-auto">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button 
                className="mr-3 md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg active:bg-slate-800"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {activeCategory ? activeCategory.name : '카테고리를 선택하세요'}
              </h2>
            </div>
            <p className="text-slate-400 text-sm md:ml-4 pb-1 hidden md:block">
              자주 사용하는 멘트를 저장하고 클릭 한 번으로 복사하세요.
            </p>
          </div>
          
          {activeCategory && (
            <button 
              onClick={openAddSnippetModal}
              className="flex-shrink-0 flex items-center space-x-2 bg-brand hover:bg-brand-dark text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg transition-all shadow-lg shadow-brand/30 hover:shadow-brand/50 font-medium text-sm md:text-base ml-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden md:inline">멘트 추가</span>
              <span className="md:hidden">추가</span>
            </button>
          )}
        </header>

        {/* Snippet Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeCategory ? (
            activeSnippets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {activeSnippets.map(snippet => (
                  <div 
                    key={snippet.id} 
                    className="group relative flex flex-col bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-brand/50 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Card Header (Label) */}
                    <div className="px-4 py-3 md:px-5 md:py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'][snippet.label.length % 4]}`}></span>
                        <span className="text-sm font-semibold text-slate-300 tracking-wide">{snippet.label}</span>
                      </div>
                      
                      {/* Action Buttons (Visible on Hover in Desktop, Always on Mobile if needed, but let's stick to hover/focus or better mobile UX) */}
                      {/* On mobile hover is tricky, so we rely on tap or the buttons being somewhat visible or the card itself. 
                          For simplicity, we keep the opacity transition but on mobile tapping empty space might not trigger hover easily.
                          Let's make them always visible on touch devices or simply keep the logic as is since modern mobile browsers handle hover on tap often.
                          Alternatively, we can show them always on small screens.
                       */}
                      <div className="flex items-center space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                         <button 
                          onClick={(e) => handleDuplicateSnippet(snippet, e)}
                          className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
                          title="복제"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => openEditSnippetModal(snippet, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="수정"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="삭제"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body (Content) - Click to Copy */}
                    <div 
                      onClick={() => copyToClipboard(snippet.content)}
                      className="p-4 md:p-5 flex-1 cursor-pointer"
                      title="클릭하여 복사"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                        {snippet.content}
                      </p>
                      <div className="mt-4 flex items-center text-brand text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <CopyIcon className="w-3 h-3 mr-1" /> 클릭하여 복사하기
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-lg">등록된 멘트가 없습니다.</p>
                <p className="text-sm mt-2">우측 상단의 버튼을 눌러 첫 멘트를 추가해보세요.</p>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
               <p className="text-lg mb-2">선택된 카테고리가 없습니다.</p>
               <p className="text-sm md:hidden">좌측 상단 메뉴 버튼을 눌러 카테고리를 선택하세요.</p>
            </div>
          )}
        </div>
      </main>

      {/* Snippet Modal (Add/Edit) */}
      <Modal 
        isOpen={isSnippetModalOpen} 
        onClose={() => setIsSnippetModalOpen(false)} 
        title={editingSnippet ? '멘트 수정' : '새 멘트 추가'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              구분 (Label)
              <span className="text-slate-600 text-xs ml-2 font-normal">카드 상단에 표시될 짧은 제목입니다.</span>
            </label>
            <input 
              type="text" 
              value={snippetForm.label}
              onChange={(e) => setSnippetForm({...snippetForm, label: e.target.value})}
              placeholder="예: 입금 계좌안내, 첫 인사"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all placeholder-slate-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              내용 (Content)
              <span className="text-slate-600 text-xs ml-2 font-normal">실제 복사될 텍스트입니다.</span>
            </label>
            <textarea 
              value={snippetForm.content}
              onChange={(e) => setSnippetForm({...snippetForm, content: e.target.value})}
              placeholder="고객에게 전송할 메시지 내용을 입력하세요..."
              rows={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all placeholder-slate-600 resize-none leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              onClick={() => setIsSnippetModalOpen(false)}
              className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
            <button 
              onClick={handleSnippetSave}
              className="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-medium shadow-lg shadow-brand/40 transition-all transform active:scale-95"
            >
              저장하기
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default App;