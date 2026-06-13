import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  category_ids?: string[];
}
