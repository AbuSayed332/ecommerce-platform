import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'Cart item ID to remove',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId({ message: 'Please provide a valid item ID' })
  itemId: string;
}