import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddToWishlistDto {
  @IsMongoId()
  user: Types.ObjectId;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string = 'My Wishlist';

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
