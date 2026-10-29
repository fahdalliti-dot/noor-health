import { Controller, Get, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: HttpStatus.OK,
      name: 'Noor Healthcare API (نُور)',
      tagline: 'Soin Numérique • Ministère de la Santé • Royaume du Maroc',
      version: '1.0.0',
      timezone: 'Africa/Casablanca',
      currency: 'MAD',
      compliance: 'CNDP Déclaration D-W-412/2026 (Loi 09-08) & Décret INPE',
      health: 'healthy',
      endpoints: {
        health: '/api/v1/health',
        analytics_dashboard: '/api/v1/analytics/dashboard',
        auth: '/api/v1/auth/login',
        appointments: '/api/v1/appointments',
        patients: '/api/v1/patients',
        payments: '/api/v1/payments',
        prescriptions: '/api/v1/prescriptions',
        certificates: '/api/v1/certificates',
        inventory: '/api/v1/inventory',
        notifications: '/api/v1/notifications',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'noor-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Casablanca',
    };
  }
}
