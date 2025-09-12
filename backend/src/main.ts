import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Frontend en desarrollo
      'http://127.0.0.1:3000',  // Alternativa de localhost
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true,  // Permitir cookies y headers de autorización
  });

  console.log('🚀 Backend iniciado en puerto:', process.env.PORT ?? 8000);
  console.log('🌐 CORS habilitado para:', 'http://localhost:3000');
  
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
