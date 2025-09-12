import { Controller, Post, Body, Get, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto, LoginDto, VerifyMfaDto, RefreshTokenDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.authService.createUser(createUserDto);
      return {
        success: true,
        message: 'Usuario creado exitosamente',
        user,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'El email ya está registrado',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Paso 1: Validar credenciales
    const user = await this.authService.validateUser(loginDto);
    
    if (!user) {
      throw new HttpException(
        'Credenciales inválidas',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Paso 2: Generar código MFA y enviarlo por email
    const mfaCode = await this.authService.generateMfaCode(user.id);

    return {
      success: true,
      message: 'Código de verificación enviado a tu email',
      tempToken: `temp_${user.id}_${Date.now()}`, // Token temporal para identificar la sesión
      expiresAt: mfaCode.expiresAt,
    };
  }

  @Post('verify-mfa')
  async verifyMfa(@Body() verifyMfaDto: VerifyMfaDto) {
    const result = await this.authService.verifyMfaCode(verifyMfaDto);

    if (!result.success) {
      throw new HttpException(
        result.message ?? 'Código de verificación inválido',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      success: true,
      message: 'Autenticación completada exitosamente',
      user: result.user,
      tokens: result.tokens,
    };
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      throw new HttpException(
        'Refresh token requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken);

    if (!result.success) {
      throw new HttpException(
        result.message ?? 'Refresh token inválido',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      success: true,
      message: 'Token renovado exitosamente',
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const result = await this.authService.getUserFromToken(
      req.headers.authorization.split(' ')[1]
    );

    if (!result.success) {
      throw new HttpException(
        result.message ?? 'Error al obtener perfil',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      success: true,
      user: result.user,
    };
  }

  @Post('validate-token')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req) {
    return {
      success: true,
      message: 'Token válido',
      user: req.user,
    };
  }

  @Post('test-email')
  async testEmail(@Body('email') email: string) {
    if (!email) {
      throw new HttpException(
        'Email requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const testResult = await this.authService.testEmailConnection();
    
    if (!testResult.success) {
      return {
        success: false,
        message: 'Error en la configuración de email',
        error: testResult.message,
      };
    }

    // Enviar email de prueba
    const emailSent = await this.authService.sendTestEmail(email);
    
    return {
      success: emailSent,
      message: emailSent 
        ? 'Email de prueba enviado exitosamente' 
        : 'Error al enviar email de prueba',
    };
  }
}
