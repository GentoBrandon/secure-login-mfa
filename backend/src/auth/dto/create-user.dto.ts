export class CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class VerifyMfaDto {
  email: string;
  code: string;
}

export class CreateVerificationCodeDto {
  userId: number;
  code: string;
  type?: 'LOGIN_MFA' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION';
  expirationMinutes?: number;
}

export class RefreshTokenDto {
  refreshToken: string;
}
