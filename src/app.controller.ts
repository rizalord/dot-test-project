import { Controller, Get, Render, Res } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import type { Response } from 'express';

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
    return { title: 'Dashboard' };
  }

  @Get('/favicon.ico')
  favicon(@Res() res: Response) {
    res.status(204).end();
  }
}
