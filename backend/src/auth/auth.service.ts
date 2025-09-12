import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthJwtService, TokenPair } from './jwt.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto, LoginDto, VerifyMfaDto, CreateVerificationCodeDto } from './dto/create-user.dto';
import { CodeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: AuthJwtService,
    private emailService: EmailService,
  ) {}

  // Crear usuario
  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Enviar email de bienvenida (no bloquear el registro si falla)
    try {
      const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : undefined;
      await this.emailService.sendWelcomeEmail(user.email, userName);
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${user.email}:`, error);
    }

    return user;
  }

  // Validar credenciales (paso 1 del login)
  async validateUser(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  // Generar código de verificación MFA (paso 2 del login)
  async generateMfaCode(userId: number, type: CodeType = CodeType.LOGIN_MFA) {
    // Obtener información del usuario para el email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Generar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Configurar expiración (10 minutos por defecto)
    const expirationMinutes = parseInt(process.env.MFA_CODE_EXPIRATION_MINUTES || '10');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    // Invalidar códigos anteriores del mismo tipo para este usuario
    await this.prisma.verificationCode.updateMany({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        isUsed: true,
      },
    });

    // Crear nuevo código
    const verificationCode = await this.prisma.verificationCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    // Enviar código por email
    try {
      const userName = user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : undefined;
      
      let emailSent = false;
      if (type === CodeType.LOGIN_MFA) {
        emailSent = await this.emailService.sendMfaCode(user.email, code, userName);
      } else if (type === CodeType.PASSWORD_RESET) {
        emailSent = await this.emailService.sendPasswordResetCode(user.email, code, userName);
      }

      if (emailSent) {
        this.logger.log(`${type} code sent to ${user.email}`);
      } else {
        this.logger.warn(`Failed to send ${type} code to ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`Error sending ${type} code to ${user.email}:`, error);
    }

    return {
      code: verificationCode.code,
      expiresAt: verificationCode.expiresAt,
    };
  }

  // Verificar código MFA (paso 3 del login)
  async verifyMfaCode(verifyMfaDto: VerifyMfaDto): Promise<{ success: boolean; message?: string; user?: any; tokens?: TokenPair }> {
    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: verifyMfaDto.email },
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Buscar código válido
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: verifyMfaDto.code,
        type: CodeType.LOGIN_MFA,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      return { success: false, message: 'Código inválido o expirado' };
    }

    // Marcar código como usado
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    // Generar tokens JWT
    const tokens = await this.jwtService.generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    };
  }

  // Limpiar códigos expirados (tarea de mantenimiento)
  async cleanExpiredCodes() {
    const result = await this.prisma.verificationCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { deletedCount: result.count };
  }

  // Obtener estadísticas de códigos
  async getCodeStats(userId: number) {
    const stats = await this.prisma.verificationCode.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        id: true,
      },
    });

    return stats;
  }

  // Refrescar access token usando refresh token
  async refreshTokens(refreshToken: string): Promise<{ success: boolean; message?: string; accessToken?: string; expiresIn?: number }> {
    try {
      const result = await this.jwtService.refreshAccessToken(refreshToken);
      
      return {
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Refresh token inválido o expirado',
      };
    }
  }

  // Obtener información del usuario desde un token válido
  async getUserFromToken(token: string): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Usuario no encontrado o inactivo',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token inválido',
      };
    }
  }

  // Probar conexión de email
  async testEmailConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const isConnected = await this.emailService.testConnection();
      return {
        success: isConnected,
        message: isConnected ? 'Conexión de email exitosa' : 'Error en la conexión de email',
      };
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return {
        success: false,
        message: 'Error al probar conexión de email',
      };
    }
  }

  // Enviar email de prueba
  async sendTestEmail(email: string): Promise<boolean> {
    try {
      const testCode = '123456';
      const success = await this.emailService.sendMfaCode(email, testCode, 'Usuario de Prueba');
      
      if (success) {
        this.logger.log(`Test email sent successfully to ${email}`);
      } else {
        this.logger.warn(`Failed to send test email to ${email}`);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Error sending test email to ${email}:`, error);
      return false;
    }
  }
}
