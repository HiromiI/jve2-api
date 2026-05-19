import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserRole } from '../users/entities/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string;
    role: UserRole;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.login(loginDto);

    this.setRefreshCookie(response, authResponse.refreshToken);

    return authResponse;
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token ?? refreshTokenDto.refreshToken;
    const authResponse = await this.authService.refresh(refreshToken);

    this.setRefreshCookie(response, authResponse.refreshToken);

    return authResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getAuthenticatedUser(request.user.userId);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('refresh_token', this.authService.getRefreshCookieOptions());

    return {
      message: 'Logout realizado com sucesso.',
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(
      'refresh_token',
      refreshToken,
      {
        ...this.authService.getRefreshCookieOptions(),
        maxAge: this.authService.getRefreshCookieMaxAge(),
      },
    );
  }
}
