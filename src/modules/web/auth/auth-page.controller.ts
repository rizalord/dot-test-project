import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';

@Public()
@Controller()
export class AuthPageController {
  @Get('/login')
  @Render('pages/auth/login')
  loginForm() {
    return { title: 'Login' };
  }

  @Get('/register')
  @Render('pages/auth/register')
  registerForm() {
    return { title: 'Register' };
  }
}
