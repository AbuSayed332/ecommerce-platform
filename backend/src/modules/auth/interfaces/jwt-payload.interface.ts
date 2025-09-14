import { UserRole } from '../../../database/schemas/user.schema';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expires at
}