import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './modules/prisma/prisma.module'
import { AuthModule as ApiAuthModule } from './modules/api/auth/auth.module'
import { AuthModule as WebAuthModule } from './modules/web/auth/auth.module';
import config from './config'

@Module({
  imports: [
    ConfigModule.forRoot({ 
      load: [() => config],
      isGlobal: true 
    }),
    PrismaModule,
    ApiAuthModule,
    WebAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
