import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './modules/prisma/prisma.module'
import { AuthModule as ApiAuthModule } from './modules/api/auth/auth.module'
import { AuthModule as WebAuthModule } from './modules/web/auth/auth.module';
import { ProductsModule } from './modules/api/products/products.module'
import { CategoriesModule } from './modules/api/categories/categories.module'
import { DashboardModule } from './modules/web/dashboard/dashboard.module'
import { WebProductsModule } from './modules/web/products/products.module'
import { WebCategoriesModule } from './modules/web/categories/categories.module'
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
    ProductsModule,
    CategoriesModule,
    DashboardModule,
    WebProductsModule,
    WebCategoriesModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
