import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common'
import { JwtCookieGuard } from './modules/web/auth/strategy/jwt-cookie.guard'
import { Request } from 'express'

@Controller()
export class AppController {
  @Get()
  @UseGuards(JwtCookieGuard)
  @Render('index')
  index(@Req() req: Request) {
    const user = (req as any).user
    return {
      title: 'Dashboard - Admin Panel',
      message: 'Welcome back, ' + user.name + '!',
      year: new Date().getFullYear(),
      user: { ...user, initial: user.name.charAt(0).toUpperCase() },
    }
  }
}
