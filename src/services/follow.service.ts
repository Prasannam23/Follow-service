import prisma from '../db/prisma';
import { AppError, ErrorCodes, createError } from '../utils/errors';
import type { FollowRequest, Pagination } from '../utils/validators';

export class FollowService {
  async followUser(request: FollowRequest): Promise<{ id: string }> {
    const { followerId, followeeId } = request;

    if (followerId === followeeId) {
      throw createError(400, 'Cannot follow yourself', ErrorCodes.SELF_FOLLOW);
    }

    const [followerExists, followeeExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId } }),
      prisma.user.findUnique({ where: { id: followeeId } })
    ]);

    if (!followerExists) {
      throw createError(404, 'Follower user not found', ErrorCodes.USER_NOT_FOUND);
    }

    if (!followeeExists) {
      throw createError(404, 'Followee user not found', ErrorCodes.USER_NOT_FOUND);
    }

    try {
      const follow = await prisma.follow.create({
        data: {
          followerId,
          followeeId
        }
      });

      return { id: follow.id };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint failed')
      ) {
        throw createError(
          409,
          'Already following this user',
          ErrorCodes.DUPLICATE_FOLLOW
        );
      }
      throw error;
    }
  }

  async unfollowUser(request: FollowRequest): Promise<void> {
    const { followerId, followeeId } = request;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId
        }
      }
    });

    if (!follow) {
      throw createError(
        404,
        'Follow relationship not found',
        ErrorCodes.FOLLOW_NOT_FOUND
      );
    }

    await prisma.follow.delete({
      where: {
        id: follow.id
      }
    });
  }

  async getFollowers(
    userId: string,
    pagination: Pagination
  ): Promise<{ total: number; items: Array<{ id: string; username: string; displayName: string | null }> }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
    }

    const [total, followers] = await Promise.all([
      prisma.follow.count({
        where: {
          followeeId: userId
        }
      }),
      prisma.follow.findMany({
        where: {
          followeeId: userId
        },
        skip: pagination.offset,
        take: pagination.limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    return {
      total,
      items: followers.map((f) => f.follower)
    };
  }

  async getFollowing(
    userId: string,
    pagination: Pagination
  ): Promise<{ total: number; items: Array<{ id: string; username: string; displayName: string | null }> }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
    }

    const [total, following] = await Promise.all([
      prisma.follow.count({
        where: {
          followerId: userId
        }
      }),
      prisma.follow.findMany({
        where: {
          followerId: userId
        },
        skip: pagination.offset,
        take: pagination.limit,
        include: {
          followee: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    return {
      total,
      items: following.map((f) => f.followee)
    };
  }

  async getAllUsers(): Promise<Array<{ id: string; username: string; displayName: string | null }>> {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true
      },
      orderBy: {
        username: 'asc'
      }
    });
  }

  async getFollowerCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
    }

    return prisma.follow.count({
      where: {
        followeeId: userId
      }
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
    }

    return prisma.follow.count({
      where: {
        followerId: userId
      }
    });
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId
        }
      }
    });

    return !!follow;
  }
}

export const followService = new FollowService();
