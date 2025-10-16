'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, Lock, Mail, CheckCircle } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Secure Login MFA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de autenticación seguro con verificación de dos factores (MFA) 
            para proteger tu cuenta con la máxima seguridad.
          </p>
        </header>

        {/* Features */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Autenticación Segura</CardTitle>
                <CardDescription>
                  Protege tu cuenta con contraseñas encriptadas y tokens JWT seguros
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Verificación por Email</CardTitle>
                <CardDescription>
                  Recibe códigos de verificación en tu email para confirmar tu identidad
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">MFA Completo</CardTitle>
                <CardDescription>
                  Autenticación de dos factores que combina algo que sabes y algo que tienes
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">¿Listo para comenzar?</CardTitle>
              <CardDescription className="text-lg mb-6">
                Crea tu cuenta o inicia sesión para experimentar la seguridad avanzada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center flex-col sm:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                    Crear Cuenta
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 w-full sm:w-auto">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
        
      </div>
    </div>
  );
}
