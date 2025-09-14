export interface WishlistResponse {
  id: string;
  user: string;
  name: string;
  description?: string;
  products: any[]; // Can be ObjectId strings or populated Product objects
  isPublic: boolean;
  isDefault: boolean;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}
