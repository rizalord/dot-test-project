import {
  Controller,
  Get,
  Post,
  Body,
  Render,
  Req,
  Res,
} from '@nestjs/common'
import { AuthService } from '../../api/auth/auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { Request, Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, access_token: string, refresh_token: string) {
    res.cookie('token', access_token, {
      httpOnly: true,
      sameSite: 'lax',
    })
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('token')
    res.clearCookie('refresh_token')
  }

  @Get('register')
  @Render('auth/register')
  async registerForm() {
    return { title: 'Register', error: null }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    if (dto.password !== dto.confirmPassword) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Password and confirm password do not match',
      })
    }

    try {
      const result = await this.authService.register(dto)
      this.setAuthCookies(res, result.data.access_token, result.data.refresh_token)
      return res.redirect('/')
    } catch (error) {
      return res.render('auth/register', {
        title: 'Register',
        error: error instanceof Error ? error.message : 'Registration failed',
      })
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
      this.setAuthCookies(res, result.data.access_token, result.data.refresh_token)
      return res.redirect('/')
    } catch (error) {
      return res.render('auth/login', {
        title: 'Login',
        error: error instanceof Error ? error.message : 'Login failed',
      })
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      return res.redirect('/auth/login')
    }

    try {
      const result = await this.authService.refresh({ refresh_token: refreshToken })
      this.setAuthCookies(res, result.data.access_token, result.data.refresh_token)
      const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/'
      return res.redirect(redirect)
    } catch {
      this.clearAuthCookies(res)
      return res.redirect('/auth/login')
    }
  }

  @Get('logout')
  @Post('logout')
  async logout(@Res() res: Response) {
    this.clearAuthCookies(res)
    return res.redirect('/auth/login')
  }
}
