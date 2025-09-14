export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
} as const;

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 3,
  [ROLES.VENDOR]: 2,
  [ROLES.CUSTOMER]: 1,
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'category:create',
    'category:read',
    'category:update',
    'category:delete',
    'order:create',
    'order:read',
    'order:update',
    'order:delete',
    'coupon:create',
    'coupon:read',
    'coupon:update',
    'coupon:delete',
    'analytics:read',
    'system:manage',
  ],
  [ROLES.VENDOR]: [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'order:read',
    'order:update',
    'analytics:read',
    'profile:update',
  ],
  [ROLES.CUSTOMER]: [
    'product:read',
    'order:create',
    'order:read',
    'cart:manage',
    'wishlist:manage',
    'review:create',
    'review:read',
    'profile:update',
  ],
} as const;