import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number; 
  email: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; 
}

@Injectable()
export class AuthJwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generates a pair of tokens (access and refresh) for a user
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

    // Get access token expiration time in seconds
    const expiresIn = this.getAccessTokenExpirationInSeconds();

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Generates an access token
   */
  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    });
  }

  /**
   * Generates a refresh token
   */
  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });
  }

  /**
   * Verifies and decodes an access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Verifies and decodes a refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Refreshes an access token using a valid refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      
      // Create new payload without iat and exp for the new token
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
   * Gets the expiration time of the access token in seconds
   */
  private getAccessTokenExpirationInSeconds(): number {
    const expiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    
    // Convert time format to seconds
    if (expiration.endsWith('m')) {
      return parseInt(expiration.slice(0, -1)) * 60;
    } else if (expiration.endsWith('h')) {
      return parseInt(expiration.slice(0, -1)) * 3600;
    } else if (expiration.endsWith('d')) {
      return parseInt(expiration.slice(0, -1)) * 86400;
    } else if (expiration.endsWith('s')) {
      return parseInt(expiration.slice(0, -1));
    } else {
      // Assume it's in seconds if there is no unit
      return parseInt(expiration);
    }
  }

  /**
   * Extracts the token from the Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
