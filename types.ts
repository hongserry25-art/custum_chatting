export interface Category {
  id: string;
  user_id?: string;
  name: string;
}

export interface Snippet {
  id: string;
  user_id?: string;
  categoryId: string;
  label: string; 
  content: string; 
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  email: string;
}