import { Controller, Get, Render } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Public()
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
