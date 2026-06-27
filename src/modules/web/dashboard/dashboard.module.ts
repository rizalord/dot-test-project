import { Module } from '@nestjs/common'
import { AuthModule } from '../../api/auth/auth.module'
import { ProductsModule } from '../../api/products/products.module'
import { CategoriesModule } from '../../api/categories/categories.module'
import { DashboardController } from './dashboard.controller'

@Module({
  imports: [AuthModule, ProductsModule, CategoriesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
