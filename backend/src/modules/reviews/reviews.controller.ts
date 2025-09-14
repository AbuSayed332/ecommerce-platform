import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { ReviewResponse } from './interfaces';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createReviewDto: CreateReviewDto): Promise<ReviewResponse> {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('productId') productId?: number,
  ): Promise<ReviewResponse[]> {
    return this.reviewsService.findAll({ page, limit, productId });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReviewResponse> {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponse> {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reviewsService.remove(id);
  }
}
