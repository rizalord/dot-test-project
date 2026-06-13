import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ApiAuthModule } from './modules/api/auth/api-auth.module';
import { ApiCategoriesModule } from './modules/api/categories/api-categories.module';
import { ApiProductsModule } from './modules/api/products/api-products.module';
import { WebAuthModule } from './modules/web/auth/web-auth.module';
import { WebCategoriesModule } from './modules/web/categories/web-categories.module';
import { WebProductsModule } from './modules/web/products/web-products.module';
import configuration from './config/app';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    PrismaModule,
    ApiAuthModule,
    ApiCategoriesModule,
    ApiProductsModule,
    WebAuthModule,
    WebCategoriesModule,
    WebProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
