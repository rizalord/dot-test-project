import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('pages/index')
  root() {
    return { title: 'Home' };
  }

  @Get('/dashboard')
  @Render('pages/dashboard/index')
  dashboard() {
    return {
      title: 'Dashboard',
      user: { name: 'Admin', initials: 'A' },
      categories: 0,
      products: 0,
    };
  }
}
