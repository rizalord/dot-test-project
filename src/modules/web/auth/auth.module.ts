import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthModule as ApiAuthModule } from '../../api/auth/auth.module'

@Module({
  imports: [ApiAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
