import axios from 'axios';
import type {
  LoginCredentials,
  RegisterCredentials,
  MfaVerification,
  LoginResponse,
  MfaVerificationResponse,
  RefreshTokenResponse,
  User,
  ApiResponse
} from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Configurar axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autorización
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y renovar tokens automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          if (response.data.success) {
            localStorage.setItem('accessToken', response.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export class AuthService {
  static async register(credentials: RegisterCredentials): Promise<ApiResponse> {
    try {
      const response = await api.post('/register', credentials);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error en el registro';
      throw new Error(errorMessage);
    }
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error en el login';
      throw new Error(errorMessage);
    }
  }

  static async verifyMfa(verification: MfaVerification): Promise<MfaVerificationResponse> {
    try {
      const response = await api.post('/verify-mfa', verification);
      
      if (response.data.success && response.data.tokens) {
        // Guardar tokens en localStorage
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error en la verificación MFA';
      throw new Error(errorMessage);
    }
  }

  static async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/refresh', { refreshToken });
      
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al renovar token';
      throw new Error(errorMessage);
    }
  }

  static async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al obtener perfil';
      throw new Error(errorMessage);
    }
  }

  static async validateToken(): Promise<ApiResponse> {
    try {
      const response = await api.post('/validate-token');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Token inválido';
      throw new Error(errorMessage);
    }
  }

  static logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  static getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}
