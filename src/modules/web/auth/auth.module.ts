import { Module } from '@nestjs/common';
import { AuthService } from './../../api/auth/auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport'
import { LocalStrategy } from './strategy/local.strategy'

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
