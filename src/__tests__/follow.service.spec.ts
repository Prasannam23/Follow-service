import { FollowService } from '../services/follow.service';
import { ErrorCodes } from '../utils/errors';
import prisma from '../db/prisma';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    follow: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}));

describe('FollowService', () => {
  const service = new FollowService();
  const mockUserId1 = 'user-1';
  const mockUserId2 = 'user-2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    it('should successfully follow a user', async () => {
      const mockFollow = { id: 'follow-1', followerId: mockUserId1, followeeId: mockUserId2, createdAt: new Date() };

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId2 });
      (prisma.follow.create as jest.Mock).mockResolvedValueOnce(mockFollow);

      const result = await service.followUser({ followerId: mockUserId1, followeeId: mockUserId2 });

      expect(result).toEqual({ id: 'follow-1' });
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: mockUserId1, followeeId: mockUserId2 }
      });
    });

    it('should throw error on self-follow', async () => {
      const error = await service.followUser({
        followerId: mockUserId1,
        followeeId: mockUserId1
      }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.SELF_FOLLOW);
      expect(error.statusCode).toBe(400);
    });

    it('should throw error if follower does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const error = await service.followUser({
        followerId: mockUserId1,
        followeeId: mockUserId2
      }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.USER_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should throw error if followee does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const error = await service.followUser({
        followerId: mockUserId1,
        followeeId: mockUserId2
      }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.USER_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should throw error on duplicate follow', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId1 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId2 });
      (prisma.follow.create as jest.Mock).mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`followerId`,`followeeId`)')
      );

      const error = await service.followUser({
        followerId: mockUserId1,
        followeeId: mockUserId2
      }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.DUPLICATE_FOLLOW);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('unfollowUser', () => {
    it('should successfully unfollow a user', async () => {
      const mockFollow = { id: 'follow-1', followerId: mockUserId1, followeeId: mockUserId2, createdAt: new Date() };

      (prisma.follow.findUnique as jest.Mock).mockResolvedValueOnce(mockFollow);
      (prisma.follow.delete as jest.Mock).mockResolvedValueOnce(mockFollow);

      await service.unfollowUser({ followerId: mockUserId1, followeeId: mockUserId2 });

      expect(prisma.follow.delete).toHaveBeenCalledWith({
        where: { id: 'follow-1' }
      });
    });

    it('should throw error if follow relationship does not exist', async () => {
      (prisma.follow.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const error = await service.unfollowUser({
        followerId: mockUserId1,
        followeeId: mockUserId2
      }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.FOLLOW_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getFollowers', () => {
    it('should return followers with pagination', async () => {
      const mockFollowers = [
        { follower: { id: 'user-3', username: 'user3', displayName: 'User 3' } }
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId1 });
      (prisma.follow.count as jest.Mock).mockResolvedValueOnce(1);
      (prisma.follow.findMany as jest.Mock).mockResolvedValueOnce(mockFollowers);

      const result = await service.getFollowers(mockUserId1, { limit: 20, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].username).toBe('user3');
    });

    it('should throw error if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const error = await service.getFollowers(mockUserId1, { limit: 20, offset: 0 }).catch(e => e);

      expect(error.code).toBe(ErrorCodes.USER_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getFollowing', () => {
    it('should return following users with pagination', async () => {
      const mockFollowing = [
        { followee: { id: 'user-4', username: 'user4', displayName: 'User 4' } }
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: mockUserId1 });
      (prisma.follow.count as jest.Mock).mockResolvedValueOnce(1);
      (prisma.follow.findMany as jest.Mock).mockResolvedValueOnce(mockFollowing);

      const result = await service.getFollowing(mockUserId1, { limit: 20, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].username).toBe('user4');
    });
  });

  describe('isFollowing', () => {
    it('should return true if user is following', async () => {
      (prisma.follow.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'follow-1' });

      const result = await service.isFollowing(mockUserId1, mockUserId2);

      expect(result).toBe(true);
    });

    it('should return false if user is not following', async () => {
      (prisma.follow.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.isFollowing(mockUserId1, mockUserId2);

      expect(result).toBe(false);
    });
  });
});
