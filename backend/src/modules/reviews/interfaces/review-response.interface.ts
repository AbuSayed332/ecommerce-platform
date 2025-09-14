export interface ReviewResponse {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}