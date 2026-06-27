import { Module } from '@nestjs/common'
import { AuthModule } from '../../api/auth/auth.module'
import { CategoriesModule as ApiCategoriesModule } from '../../api/categories/categories.module'
import { WebCategoriesController } from './categories.controller'

@Module({
  imports: [AuthModule, ApiCategoriesModule],
  controllers: [WebCategoriesController],
})
export class WebCategoriesModule {}
