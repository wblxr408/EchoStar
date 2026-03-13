import { Router } from 'express';
import * as mapController from '../modules/map/map.controller.js';
import { looseLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * GET /api/map/explore - 范围查询故事
 * Query: ?latitude=39.9042&longitude=116.4074&radius=1000
 */
router.get('/explore', looseLimiter, mapController.exploreStories);

/**
 * GET /api/map/random - 随机漫步
 */
router.get('/random', mapController.randomWalk);

/**
 * GET /api/map/wall - 同地点故事墙
 * Query: ?latitude=39.9042&longitude=116.4074&radius=50
 */
router.get('/wall', mapController.getLocationWall);

/**
 * GET /api/map/clusters - 获取聚合数据
 * Query: ?northEast={"lat":40,"lng":117}&southWest={"lat":39,"lng":116}
 */
router.get('/clusters', mapController.getClusterData);

export default router;
