import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get('dashboard')
  getDashboard(@Request() req) {
    return {
      success: true,
      message: 'Bienvenido al dashboard protegido',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin')
  getAdminData(@Request() req) {
    return {
      success: true,
      message: 'Datos administrativos',
      user: req.user,
      adminData: {
        totalUsers: 150,
        activeLogins: 45,
        systemStatus: 'operational',
      },
    };
  }
}
