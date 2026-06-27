import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
      response.clearCookie('token')
      response.clearCookie('refresh_token')
      response.redirect('/auth/login')
      return false
    }
  }
}
