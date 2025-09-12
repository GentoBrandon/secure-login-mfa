import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number; // user id
  email: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos hasta expiración del access token
}

@Injectable()
export class AuthJwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Genera un par de tokens (access y refresh) para un usuario
   */
  async generateTokens(user: { id: number; email: string; firstName?: string; lastName?: string }): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    // Obtener tiempo de expiración del access token en segundos
    const expiresIn = this.getAccessTokenExpirationInSeconds();

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Genera un access token
   */
  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    });
  }

  /**
   * Genera un refresh token
   */
  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });
  }

  /**
   * Verifica y decodifica un access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Verifica y decodifica un refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Refresca un access token usando un refresh token válido
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      
      // Crear nuevo payload sin iat y exp para el nuevo token
      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };

      const accessToken = await this.generateAccessToken(newPayload);
      const expiresIn = this.getAccessTokenExpirationInSeconds();

      return {
        accessToken,
        expiresIn,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Obtiene el tiempo de expiración del access token en segundos
   */
  private getAccessTokenExpirationInSeconds(): number {
    const expiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    
    // Convertir formato de tiempo a segundos
    if (expiration.endsWith('m')) {
      return parseInt(expiration.slice(0, -1)) * 60;
    } else if (expiration.endsWith('h')) {
      return parseInt(expiration.slice(0, -1)) * 3600;
    } else if (expiration.endsWith('d')) {
      return parseInt(expiration.slice(0, -1)) * 86400;
    } else if (expiration.endsWith('s')) {
      return parseInt(expiration.slice(0, -1));
    } else {
      // Asumir que es en segundos si no hay unidad
      return parseInt(expiration);
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
