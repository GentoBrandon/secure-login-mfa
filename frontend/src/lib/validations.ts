import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z
    .string()
    .optional(),
  lastName: z
    .string()
    .optional(),
});

export const mfaVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'El código debe contener solo números'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MfaVerificationFormData = z.infer<typeof mfaVerificationSchema>;
