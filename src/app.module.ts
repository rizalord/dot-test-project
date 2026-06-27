import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './modules/prisma/prisma.module'
import { AuthModule as ApiAuthModule } from './modules/api/auth/auth.module'
import { AuthModule as WebAuthModule } from './modules/web/auth/auth.module';
import configFn from './config'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configFn],
      isGlobal: true
    }),
    PrismaModule,
    ApiAuthModule,
    WebAuthModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
