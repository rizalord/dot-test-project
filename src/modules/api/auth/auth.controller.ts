import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import type { ResponseDto } from '../../../common/dto/response.dto';
import type {
  AuthTokenResource,
  AuthUserResource,
  AuthenticatedUser,
} from './types/auth.types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  register(
    @Body() dto: RegisterRequestDto,
  ): Promise<ResponseDto<AuthTokenResource>> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginRequestDto): Promise<ResponseDto<AuthTokenResource>> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body() dto: RefreshRequestDto,
  ): Promise<ResponseDto<AuthTokenResource>> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<AuthUserResource>> {
    return this.authService.me(user.id);
  }
}
