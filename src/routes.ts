import { Router } from 'express';
import { followController } from './controllers/follow.controller';

const router = Router();


router.post('/follows', followController.follow);
router.delete('/follows', followController.unfollow);
router.get('/follows/check', followController.isFollowing);

// User operations
router.get('/users', followController.getAllUsers);

// Follower/Following operations
router.get('/users/:userId/followers', followController.getFollowers);
router.get('/users/:userId/followers/count', followController.getFollowerCount);
router.get('/users/:userId/following', followController.getFollowing);
router.get('/users/:userId/following/count', followController.getFollowingCount);

export default router;
