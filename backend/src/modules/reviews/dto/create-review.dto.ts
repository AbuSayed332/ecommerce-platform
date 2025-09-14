import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  userId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;
}
