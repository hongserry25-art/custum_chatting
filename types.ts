export interface Category {
  id: string;
  name: string;
}

export interface Snippet {
  id: string;
  categoryId: string;
  label: string; // The short distinguishing text
  content: string; // The main content to copy
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  email: string;
  password?: string; // Only used for auth verification, normally wouldn't keep in state
}