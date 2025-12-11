import { z } from 'zod';

export const FollowRequestSchema = z.object({
  followerId: z.string().uuid('followerId must be a valid UUID'),
  followeeId: z.string().uuid('followeeId must be a valid UUID')
});

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0)
});

export type FollowRequest = z.infer<typeof FollowRequestSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
