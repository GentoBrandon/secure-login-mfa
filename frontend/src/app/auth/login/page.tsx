'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { MfaVerification } from '@/components/auth/mfa-verification';
import { Button } from '@/components/ui/button';

type AuthStep = 'login' | 'mfa';

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [mfaData, setMfaData] = useState<{ email: string; tempToken: string } | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSuccess = (email: string, tempToken: string) => {
    setMfaData({ email, tempToken });
    setCurrentStep('mfa');
  };

  const handleMfaSuccess = () => {
    router.push('/dashboard');
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    setMfaData(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {currentStep === 'login' && (
          <>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </>
        )}

        {currentStep === 'mfa' && mfaData && (
          <MfaVerification
            email={mfaData.email}
            tempToken={mfaData.tempToken}
            onVerificationSuccess={handleMfaSuccess}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </div>
    </div>
  );
}
