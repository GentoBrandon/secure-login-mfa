'use client';

import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, User, Mail, Calendar, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Bienvenido, {user?.firstName || user?.email}!
              </h1>
              <p className="text-gray-600">
                Has iniciado sesión exitosamente con autenticación de dos factores
              </p>
            </div>

            {/* Success Card */}
            <Card className="max-w-2xl mx-auto bg-green-50 border-green-200">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800">Autenticación Exitosa</CardTitle>
                <CardDescription className="text-green-700">
                  Tu cuenta está protegida con autenticación de dos factores (2FA)
                </CardDescription>
              </CardHeader>
            </Card>

            {/* User Info Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium ml-2">Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || 'Usuario'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {user?.id}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium ml-2">Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold break-all">
                    {user?.email}
                  </div>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    <p className="text-xs text-muted-foreground">
                      {user?.isEmailVerified ? 'Verificado' : 'No verificado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium ml-2">Seguridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    MFA Activo
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Autenticación de dos factores habilitada
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium ml-2">Registro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fecha de creación de cuenta
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium ml-2">Última actualización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Última modificación
                  </p>
                </CardContent>
              </Card>
            </div>            
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
