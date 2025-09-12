'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthService } from '@/lib/auth-service';
import type { AuthState, User, AuthTokens, LoginCredentials, RegisterCredentials, MfaVerification } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; tempToken?: string; message: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string }>;
  verifyMfa: (verification: MfaVerification) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKENS'; payload: AuthTokens | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Inicializar el estado de autenticación al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Verificar si hay tokens almacenados
        const isAuth = AuthService.isAuthenticated();
        const storedUser = AuthService.getStoredUser();
        const accessToken = AuthService.getAccessToken();
        
        if (isAuth && storedUser && accessToken) {
          // Validar token con el servidor
          try {
            await AuthService.validateToken();
            dispatch({ type: 'SET_USER', payload: storedUser });
            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
          } catch (error) {
            // Token inválido, limpiar estado
            AuthService.logout();
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        AuthService.logout();
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await AuthService.login(credentials);
      
      return {
        success: response.success,
        tempToken: response.tempToken,
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en el login',
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await AuthService.register(credentials);
      
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en el registro',
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyMfa = async (verification: MfaVerification) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await AuthService.verifyMfa(verification);
      
      if (response.success) {
        dispatch({ type: 'SET_USER', payload: response.user });
        dispatch({ type: 'SET_TOKENS', payload: response.tokens });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      }
      
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en la verificación MFA',
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    AuthService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      await AuthService.refreshToken();
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    verifyMfa,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
