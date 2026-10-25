import { Controller, Post, Get, Body, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../guards/local.guard';
import { TwoFaGuard } from '../guards/two-fa.guard';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { GetUser } from '../decorators/user.decorator';
import { ResponseFormat } from '../decorators/response.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ResponseFormat()
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Req() req: any,
  ) {
    const user = req.user || (await this.authService.validateUser(email, password));
    if (!user) {
      return {
        status: 401,
        data: { error: 'Invalid credentials' },
      };
    }

    const result = await this.authService.login(
      user,
      req.ip,
      req.get('User-Agent') || '',
    );

    if ('status' in result && result.status === 'two_factor_required') {
      return {
        status: 200,
        data: {
          status: 'two_factor_required',
          session_id: result.session_id,
          challenge_token: result.challenge_token,
        },
      };
    }

    const tokenResult = result as { access_token: string; refresh_token: string; session_id: string };
    return {
      status: 200,
      data: {
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        session_id: tokenResult.session_id,
      },
    };
  }

  @Post('2fa/verify')
  @UseGuards(TwoFaGuard)
  @ResponseFormat()
  async verify2fa(
    @Body('session_id') sessionId: string,
    @Body('totp_code') totpCode: string,
    @Req() req: any,
  ) {
    const result = await this.authService.loginWith2fa(
      sessionId,
      totpCode,
      req.ip,
      req.get('User-Agent') || '',
    );

    return {
      status: 200,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        session_id: result.session_id,
      },
    };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async setup2fa(@GetUser() user: any) {
    const result = await this.authService.setup2fa(user);

    return {
      status: 200,
      data: {
        qr_code_uri: result.qrCodeUri,
        backup_codes: result.backupCodes,
      },
    };
  }

  @Post('2fa/confirm')
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async confirm2faSetup(
    @Body('totp_code') totpCode: string,
    @GetUser() user: any,
  ) {
    const isValid = await this.authService.verify2faSetup(user, totpCode);

    if (!isValid) {
      return {
        status: 400,
        data: { valid: false },
      };
    }

    return {
      status: 200,
      data: { valid: true },
    };
  }

  @Post('refresh')
  @ResponseFormat()
  async refresh(@Body('refresh_token') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);

    return {
      status: 200,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        session_id: result.session_id,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async logout(@GetUser() user: any) {
    await this.authService.logout(user.session.id, user.id);

    return {
      status: 200,
      data: { success: true },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ResponseFormat()
  async me(@GetUser() user: any) {
    const fullUser = await this.authService.findById(user.id);
    return {
      status: 200,
      data: {
        id: fullUser.id,
        clinic_id: fullUser.clinic_id,
        role: fullUser.role,
        is_clinic_admin: fullUser.is_clinic_admin,
        full_name: fullUser.full_name,
        email: fullUser.email,
      },
    };
  }

  @Post('invites/accept')
  @ResponseFormat()
  async acceptInvite(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    const result = await this.authService.acceptInvite(
      token,
      password,
      'doctor', // role will come from invite metadata
    );

    return {
      status: 200,
      data: {
        user: result.user,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        session_id: result.session_id,
      },
    };
  }

  @Post('password/forgot')
  @ResponseFormat()
  async passwordForgot(@Body('email') email: string) {
    const result = await this.authService.resetPassword(email);

    if (!result.success) {
      // Generic - don't enumerate
      return {
        status: 404,
        data: { error: 'If an account exists with this email, you will receive a reset link' },
      };
    }

    return {
      status: 200,
      data: { success: true },
    };
  }

  @Post('password/reset')
  @ResponseFormat()
  async passwordReset(
    @Body('token') token: string,
    @Body('new_password') newPassword: string,
  ) {
    const result = await this.authService.completePasswordReset(token, newPassword);

    if (!result.success) {
      return {
        status: 400,
        data: { error: 'Invalid or expired reset token' },
      };
    }

    return {
      status: 200,
      data: { success: true },
    };
  }
}
