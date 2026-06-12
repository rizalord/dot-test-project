import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AuthController {
  @Get('/login')
  @Render('auth/login')
  loginForm() {
    return { title: 'Login' };
  }

  @Get('/register')
  @Render('auth/register')
  registerForm() {
    return { title: 'Register' };
  }
}
