import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { ReviewResponse } from './interfaces';

interface FindAllOptions {
  page?: number;
  limit?: number;
  productId?: number;
}

@Injectable()
export class ReviewsService {
  // In a real app, you'd inject a repository/database service here
  private reviews: ReviewResponse[] = [];
  private nextId = 1;

  async create(createReviewDto: CreateReviewDto): Promise<ReviewResponse> {
    const review: ReviewResponse = {
      id: this.nextId++,
      ...createReviewDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.push(review);
    return review;
  }

  async findAll(options: FindAllOptions = {}): Promise<ReviewResponse[]> {
    let filteredReviews = [...this.reviews];

    // Filter by productId if provided
    if (options.productId) {
      filteredReviews = filteredReviews.filter(
        review => review.productId === options.productId,
      );
    }

    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredReviews.slice(startIndex, endIndex);
  }

  async findOne(id: number): Promise<ReviewResponse> {
    const review = this.reviews.find(review => review.id === id);
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto): Promise<ReviewResponse> {
    const reviewIndex = this.reviews.findIndex(review => review.id === id);
    if (reviewIndex === -1) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const updatedReview = {
      ...this.reviews[reviewIndex],
      ...updateReviewDto,
      updatedAt: new Date(),
    };

    this.reviews[reviewIndex] = updatedReview;
    return updatedReview;
  }

  async remove(id: number): Promise<void> {
    const reviewIndex = this.reviews.findIndex(review => review.id === id);
    if (reviewIndex === -1) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    this.reviews.splice(reviewIndex, 1);
  }
}