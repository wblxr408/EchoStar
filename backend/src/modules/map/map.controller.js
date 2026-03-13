import { MapService } from './map.service.js';

/**
 * 范围查询故事
 */
export const exploreStories = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        code: 400,
        message: '缺少经纬度参数'
      });
    }

    const stories = await MapService.exploreStories(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );

    res.json({ code: 0, data: stories });
  } catch (error) {
    next(error);
  }
};

/**
 * 随机漫步
 */
export const randomWalk = async (req, res, next) => {
  try {
    const story = await MapService.randomWalk();
    res.json({ code: 0, data: story });
  } catch (error) {
    next(error);
  }
};

/**
 * 同地点故事墙
 */
export const getLocationWall = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        code: 400,
        message: '缺少经纬度参数'
      });
    }

    const stories = await MapService.getLocationWall(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );

    res.json({ code: 0, data: stories });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取聚合数据
 */
export const getClusterData = async (req, res, next) => {
  try {
    const { northEast, southWest } = req.query;

    if (!northEast || !southWest) {
      return res.status(400).json({
        code: 400,
        message: '缺少边界参数'
      });
    }

    const bounds = {
      northEast: JSON.parse(northEast),
      southWest: JSON.parse(southWest)
    };

    const clusters = await MapService.getClusterData(bounds);
    res.json({ code: 0, data: clusters });
  } catch (error) {
    next(error);
  }
};
