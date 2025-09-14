import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsPhoneNumber,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../database/schemas/user.schema';

class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MaxLength(200)
  street: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @MaxLength(50)
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @MaxLength(20)
  zipCode: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @MaxLength(50)
  country: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault?: boolean;
}

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  // pass undefined (or omit the arg) instead of null — typings expect string | undefined
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid UserRole' })
  role?: UserRole;

  @ApiPropertyOptional({ type: [AddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @ArrayMaxSize(5, { message: 'Maximum 5 addresses allowed' })
  address?: AddressDto[];

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  // robust transform: accept Date, number, string; return undefined for falsy values
  @Transform(({ value }) => {
    if (!value && value !== 0) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ example: 'male', enum: ['male', 'female', 'other'] })
  @IsOptional()
  // use IsIn for a set of string choices (or define a Gender enum and use IsEnum)
  @IsIn(['male', 'female', 'other'], { message: 'Gender must be male, female or other' })
  gender?: string;

  @ApiPropertyOptional({ example: ['electronics', 'books'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  preferences?: string[];
}
