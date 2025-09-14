import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto extends OmitType(CreateUserDto, [
  'password',
  'role',
] as const) {
  @ApiPropertyOptional({ example: 'SecureNewPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword?: string;

  @ApiPropertyOptional({ example: 'CurrentPassword123!' })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}