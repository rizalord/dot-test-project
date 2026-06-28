import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../../../api/auth/auth.service'
import { Request, Response } from 'express'

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const token = request.cookies?.token

    if (!token) {
      response.redirect('/auth/login')
      return false
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      })
      ;(request as any).user = payload
      return true
    } catch {
      // Token expired — try to refresh using refresh_token cookie
      return await this.tryRefresh(request, response)
    }
  }

  private async tryRefresh(request: Request, response: Response): Promise<boolean> {
    const refreshToken = request.cookies?.refresh_token

    if (!refreshToken) {
      this.clearAndRedirect(response)
      return false
    }

    try {
      const result = await this.authService.refresh({ refresh_token: refreshToken })

      response.cookie('token', result.data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
      })
      response.cookie('refresh_token', result.data.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      const payload = this.jwtService.decode(result.data.access_token) as any
      ;(request as any).user = payload
      return true
    } catch {
      this.clearAndRedirect(response)
      return false
    }
  }

  private clearAndRedirect(response: Response) {
    response.clearCookie('token')
    response.clearCookie('refresh_token')
    response.redirect('/auth/login')
  }
}
