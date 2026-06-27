import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  Res,
} from '@nestjs/common'
import { AuthService } from '../../api/auth/auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('register')
  @Render('auth/register')
  async registerForm() {
    return { title: 'Register', error: null }
  }

  @Post('register')
  @Render('auth/register')
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      return { title: 'Register', error: 'Password and confirm password do not match' }
    }

    try {
      await this.authService.register(dto)
      return { title: 'Register', success: 'Registration successful! Please login.' }
    } catch (error) {
      return {
        title: 'Register',
        error: error instanceof Error ? error.message : 'Registration failed',
      }
    }
  }

  @Get('login')
  @Render('auth/login')
  async loginForm() {
    return { title: 'Login', error: null }
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(dto)

      res.cookie('token', result.data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      })

      return res.redirect('/')
    } catch (error) {
      return res.render('auth/login', {
        title: 'Login',
        error: error instanceof Error ? error.message : 'Login failed',
      })
    }
  }

  @Get('logout')
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token')
    res.clearCookie('refresh_token')
    return res.redirect('/auth/login')
  }
}
