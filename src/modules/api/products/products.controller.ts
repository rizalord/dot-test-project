import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import type { ResponseDto } from '../../../common/dto/response.dto';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { ProductResource } from './types/product.types';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResponseDto<ProductResource[]>> {
    return this.productsService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<ProductResource>> {
    return this.productsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ResponseDto<ProductResource>> {
    return this.productsService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ResponseDto<ProductResource>> {
    return this.productsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<null>> {
    return this.productsService.remove(user.id, id);
  }
}
