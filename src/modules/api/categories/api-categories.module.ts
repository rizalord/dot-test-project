import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ApiAuthModule } from '../auth/api-auth.module';

@Module({
  imports: [ApiAuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class ApiCategoriesModule {}
