import { Module } from '@nestjs/common'
import { AuthModule } from '../../api/auth/auth.module'
import { ProductsModule as ApiProductsModule } from '../../api/products/products.module'
import { CategoriesModule as ApiCategoriesModule } from '../../api/categories/categories.module'
import { WebProductsController } from './products.controller'

@Module({
  imports: [AuthModule, ApiProductsModule, ApiCategoriesModule],
  controllers: [WebProductsController],
})
export class WebProductsModule {}
