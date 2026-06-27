import { Controller, Get, Render } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Render('index')
  index() {
    return {
      title: 'Dashboard - Admin Panel',
      message: this.appService.getHello(),
      year: new Date().getFullYear(),
    }
  }
}
