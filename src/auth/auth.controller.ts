import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { UserRole } from '../users/entities/user-role.enum';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

 class SignUpDto {
   @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
   @IsString()
   @IsNotEmpty()
   @MaxLength(255)
   name: string;

   @Transform(({ value }) => {
     if (typeof value !== 'string') {
       return value;
     }

     const normalizedValue = value.trim().toLowerCase();

     return normalizedValue === '' ? undefined : normalizedValue;
   })
   @IsOptional()
   @IsEmail()
   @MaxLength(255)
   email?: string;

   @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
   @IsString()
   @IsNotEmpty()
   @MaxLength(20)
   phone: string;

   @IsString()
   @IsNotEmpty()
   @MinLength(8)
   @MaxLength(72)
   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/)
   password: string;
 }

class LoginPhoneDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class ForgotPasswordSendCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;
}

class ForgotPasswordValidateCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  code: string;
}

class ForgotPasswordResetDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  confirmPassword: string;
}

type AuthenticatedRequest = Request & {
  user: {
    userId: number;
    email: string | null;
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

  @Post('login-phone')
  async loginPhone(
    @Body() loginDto: LoginPhoneDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.loginWithPhone(loginDto.phone, loginDto.password);

    this.setRefreshCookie(response, authResponse.refreshToken);

    return authResponse;
  }

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUpStudent(signUpDto);
  }

  @Post('forgot-password/send-code')
  sendForgotPasswordCode(@Body() dto: ForgotPasswordSendCodeDto) {
    return this.authService.sendForgotPasswordCode(dto.phone);
  }

  @Post('forgot-password/validate-code')
  validateForgotPasswordCode(@Body() dto: ForgotPasswordValidateCodeDto) {
    return this.authService.validateForgotPasswordCode(dto.phone, dto.code);
  }

  @Post('forgot-password/reset-password')
  resetForgotPassword(@Body() dto: ForgotPasswordResetDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('As senhas devem ser iguais.');
    }

    return this.authService.resetForgotPassword(dto.phone, dto.code, dto.password);
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
