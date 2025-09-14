import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { UserStatus } from '../../../database/schemas/user.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const)
) {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  loyaltyPoints?: number;
}


