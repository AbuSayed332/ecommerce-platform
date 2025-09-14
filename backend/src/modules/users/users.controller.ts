import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import * as usersService from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto';
import { UserResponseInterface } from './interfaces';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, User } from '../../database/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes';
import { UserProfileResponse } from './interfaces/user-response.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: usersService.UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseInterface> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination and filtering (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() query: usersService.UserQueryOptions) {
    return this.usersService.findAll(query);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser('_id') userId: Types.ObjectId): Promise<UserProfileResponse> {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async updateProfile(
    @CurrentUser('_id') userId: Types.ObjectId,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseInterface> {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<UserResponseInterface> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseInterface> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.usersService.remove(id, currentUser);
  }

  @Patch(':id/verify-email')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verify user email (Admin only)' })
  @ApiResponse({ status: 204, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.usersService.verifyEmail(id);
  }

  @Patch(':id/loyalty-points')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add loyalty points to user (Admin only)' })
  @ApiResponse({ status: 204, description: 'Loyalty points added successfully' })
  async addLoyaltyPoints(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('points') points: number,
  ): Promise<void> {
    return this.usersService.addLoyaltyPoints(id, points);
  }
}
