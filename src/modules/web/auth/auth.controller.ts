import { Controller, Get, Post, Body, Patch, Param, Delete, Render, BadRequestException, UseGuards, Request } from '@nestjs/common'
import { AuthService } from './../../api/auth/auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { LocalAuthGuard } from './strategy/local-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('auth/register')
  @Render('auth/register')
  async registerForm() {
    return {
      status: null,
      message: null,
    }
  }

  @Post('auth/register')
  @Render('auth/register')
  async register(@Body() registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match')
    }

    try {
      const result = await this.authService.register(registerDto)
      return {
        status: true,
        message: 'Registration successful'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      return {
        status: false,
        message
      }
    }
  }

  @Get('auth/login')
  @Render('auth/login')
  async loginForm() {
    return {
      status: null,
      message: null,
    }
  }

  @Post('auth/login')
  @UseGuards(LocalAuthGuard)
  @Render('auth/login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto)
      return {
        status: true,
        message: 'Login successful'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      return {
        status: false,
        message
      }
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    return req.logout()
  }

}
