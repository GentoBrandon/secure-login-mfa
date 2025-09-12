'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { mfaVerificationSchema, type MfaVerificationFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertMessage } from '@/components/ui/alert';

interface MfaVerificationProps {
  email: string;
  tempToken: string;
  onVerificationSuccess: () => void;
  onBackToLogin: () => void;
}

export const MfaVerification: React.FC<MfaVerificationProps> = ({
  email,
  tempToken,
  onVerificationSuccess,
  onBackToLogin
}) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  const { verifyMfa, isLoading } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MfaVerificationFormData>({
    resolver: zodResolver(mfaVerificationSchema),
    defaultValues: {
      email,
      code: '',
    },
  });

  const watchedCode = watch('code');

  // Contador regresivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMessage({
            type: 'error',
            text: 'El código ha expirado. Por favor, inicia sesión nuevamente.'
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Manejar input de código de 6 dígitos
  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Si se pega un código completo
      const digits = value.slice(0, 6).split('');
      digits.forEach((digit, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i]!.value = digit;
        }
      });
      setValue('code', digits.join(''));
      
      // Enfocar el último input o el siguiente vacío
      const nextEmptyIndex = digits.findIndex((d, i) => i < 6 && !d);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    // Input normal de un dígito
    if (value && /^\d$/.test(value)) {
      const newCode = watchedCode.split('');
      newCode[index] = value;
      setValue('code', newCode.join(''));
      
      // Mover al siguiente input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (value === '') {
      const newCode = watchedCode.split('');
      newCode[index] = '';
      setValue('code', newCode.join(''));
    }
  };

  // Manejar teclas especiales
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !watchedCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onSubmit = async (data: MfaVerificationFormData) => {
    if (timeLeft <= 0) {
      setMessage({
        type: 'error',
        text: 'El código ha expirado. Por favor, inicia sesión nuevamente.'
      });
      return;
    }

    setMessage(null);
    
    try {
      const result = await verifyMfa(data);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Verificación exitosa. Redirigiendo...'
        });
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Código de verificación inválido'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error inesperado. Por favor, intenta de nuevo.'
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Verificación de Seguridad</CardTitle>
        <CardDescription>
          Hemos enviado un código de 6 dígitos a<br />
          <strong>{email}</strong>
        </CardDescription>
        <div className="text-sm text-muted-foreground">
          Tiempo restante: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-center block">
              Código de verificación
            </label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d"
                  maxLength={6}
                  className="w-12 h-12 text-center text-lg font-mono"
                  onChange={(e) => handleCodeInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={timeLeft <= 0}
                />
              ))}
            </div>
            {errors.code && (
              <p className="text-sm text-destructive text-center">{errors.code.message}</p>
            )}
          </div>

          {message && (
            <AlertMessage variant={message.type === 'error' ? 'destructive' : 'success'}>
              {message.text}
            </AlertMessage>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || timeLeft <= 0 || watchedCode.length !== 6}
            >
              {isLoading ? 'Verificando...' : 'Verificar Código'}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onBackToLogin}
                disabled={isLoading}
              >
                Volver al Login
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
                disabled={isLoading}
                title="Solicitar nuevo código"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ¿No recibiste el código? Revisa tu carpeta de spam o solicita uno nuevo.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
