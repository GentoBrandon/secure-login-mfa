import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP configuration incomplete. Email service will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // Para desarrollo, en producción usar certificados válidos
      },
    });

    this.logger.log('Email transporter configured successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not configured. Cannot send email.');
      return false;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@yourapp.com'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendMfaCode(email: string, code: string, userName?: string): Promise<boolean> {
    const subject = 'Código de verificación - Secure Login';
    const html = this.getMfaCodeTemplate(code, userName);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordResetCode(email: string, code: string, userName?: string): Promise<boolean> {
    const subject = 'Código de recuperación de contraseña - Secure Login';
    const html = this.getPasswordResetTemplate(code, userName);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
    const subject = '¡Bienvenido a Secure Login!';
    const html = this.getWelcomeTemplate(userName);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private getMfaCodeTemplate(code: string, userName?: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .code-container {
                background: #f8fafc;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .code {
                font-size: 32px;
                font-weight: bold;
                color: #1e40af;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 Secure Login</div>
                <h1>Código de Verificación</h1>
            </div>
            
            <p>Hola${userName ? ` ${userName}` : ''},</p>
            
            <p>Has solicitado acceder a tu cuenta. Para completar el proceso de autenticación, usa el siguiente código de verificación:</p>
            
            <div class="code-container">
                <div class="code">${code}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este código es válido por <strong>10 minutos</strong></li>
                    <li>Solo puede ser usado <strong>una vez</strong></li>
                    <li>Si no solicitaste este código, ignora este email</li>
                </ul>
            </div>
            
            <p>Si tienes problemas para acceder a tu cuenta, contacta con nuestro soporte técnico.</p>
            
            <div class="footer">
                <p>Este es un email automático, no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} Secure Login. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getPasswordResetTemplate(code: string, userName?: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 10px;
            }
            .code-container {
                background: #fef2f2;
                border: 2px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }
            .code {
                font-size: 32px;
                font-weight: bold;
                color: #dc2626;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔓 Secure Login</div>
                <h1>Recuperación de Contraseña</h1>
            </div>
            
            <p>Hola${userName ? ` ${userName}` : ''},</p>
            
            <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para continuar con el proceso:</p>
            
            <div class="code-container">
                <div class="code">${code}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este código es válido por <strong>10 minutos</strong></li>
                    <li>Solo puede ser usado <strong>una vez</strong></li>
                    <li>Si no solicitaste esto, cambia tu contraseña inmediatamente</li>
                </ul>
            </div>
            
            <p>Por seguridad, asegúrate de crear una contraseña fuerte que incluya mayúsculas, minúsculas, números y símbolos.</p>
            
            <div class="footer">
                <p>Este es un email automático, no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} Secure Login. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getWelcomeTemplate(userName?: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #16a34a;
                margin-bottom: 10px;
            }
            .welcome-banner {
                background: linear-gradient(135deg, #16a34a, #22c55e);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .features {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎉 Secure Login</div>
                <h1>¡Bienvenido a bordo!</h1>
            </div>
            
            <div class="welcome-banner">
                <h2>¡Hola${userName ? ` ${userName}` : ''}!</h2>
                <p>Tu cuenta ha sido creada exitosamente</p>
            </div>
            
            <p>Gracias por unirte a Secure Login. Tu cuenta está ahora protegida con autenticación de dos factores (MFA) para garantizar la máxima seguridad.</p>
            
            <div class="features">
                <h3>🔐 Características de seguridad activadas:</h3>
                <ul>
                    <li><strong>Autenticación de dos factores (MFA)</strong> - Códigos de verificación por email</li>
                    <li><strong>Tokens JWT seguros</strong> - Sesiones protegidas con renovación automática</li>
                    <li><strong>Contraseñas encriptadas</strong> - Almacenamiento seguro con bcrypt</li>
                    <li><strong>Códigos temporales</strong> - Expiración automática por seguridad</li>
                </ul>
            </div>
            
            <p>Para acceder a tu cuenta:</p>
            <ol>
                <li>Ingresa tu email y contraseña</li>
                <li>Revisa tu email para el código de verificación</li>
                <li>Ingresa el código para completar el acceso</li>
            </ol>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.</p>
            
            <div class="footer">
                <p>Este es un email automático, no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} Secure Login. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }
}
