import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ApiAuthModule } from '../auth/api-auth.module';

@Module({
  imports: [ApiAuthModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ApiProductsModule {}
