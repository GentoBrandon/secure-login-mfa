export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface MfaVerification {
  email: string;
  code: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  tempToken: string;
  expiresAt: string;
}

export interface MfaVerificationResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken: string;
  expiresIn: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
