import { Request, Response } from 'express';
import { followService } from '../services/follow.service';
import { FollowRequestSchema, PaginationSchema } from '../utils/validators';
import { createError, ErrorCodes } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

export const followController = {
  follow: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = FollowRequestSchema.parse(req.body);
    const result = await followService.followUser(validatedData);
    res.status(201).json({
      success: true,
      message: 'User followed successfully',
      data: result
    });
  }),

  unfollow: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = FollowRequestSchema.parse(req.body);
    await followService.unfollowUser(validatedData);
    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });
  }),

  getFollowers: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const pagination = PaginationSchema.parse(req.query);

    const result = await followService.getFollowers(userId, pagination);
    res.status(200).json({
      success: true,
      data: result
    });
  }),

  getFollowing: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const pagination = PaginationSchema.parse(req.query);

    const result = await followService.getFollowing(userId, pagination);
    res.status(200).json({
      success: true,
      data: result
    });
  }),

  getAllUsers: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await followService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('getAllUsers failed:', err.message);
        throw createError(500, err.message || 'Failed to fetch users', ErrorCodes.INTERNAL_ERROR);
      }
      throw createError(500, 'Failed to fetch users', ErrorCodes.INTERNAL_ERROR);
    }
  }),

  getFollowerCount: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const count = await followService.getFollowerCount(userId);
    res.status(200).json({
      success: true,
      data: { count }
    });
  }),

  getFollowingCount: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const count = await followService.getFollowingCount(userId);
    res.status(200).json({
      success: true,
      data: { count }
    });
  }),

  isFollowing: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { followerId, followeeId } = req.query;

    if (typeof followerId !== 'string' || typeof followeeId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'followerId and followeeId query parameters are required'
      });
      return;
    }

    const isFollowing = await followService.isFollowing(followerId, followeeId);
    res.status(200).json({
      success: true,
      data: { isFollowing }
    });
  })
};
