// Shared TypeScript types for Life Psychology monorepo

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Export all database types
export * from './database';
export * from './mappers';
