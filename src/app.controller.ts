import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { year: new Date().getFullYear() };
  }

  @Get('/dashboard')
  @Render('dashboard/index')
  dashboard() {
    return {
      user: { name: 'Admin', initials: 'A' },
      categories: 0,
      products: 0,
    };
  }
}
