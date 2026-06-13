import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AuthController {
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
