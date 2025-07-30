import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { Between } from 'typeorm';
import { getCountryFromIP, extractClientIP, getIPCacheStats } from '../utils/ipUtils';

const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (
    ua.includes('ipad') || 
    ua.includes('tablet') || 
    (ua.includes('android') && !ua.includes('mobi'))
  ) {
    return 'tablet';
  }
  
  if (
    ua.includes('mobi') || 
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }
  
  return 'desktop';
}



/**
 * Test endpoint to verify IP country detection
 */
export const testIPCountry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ip } = req.params;
    const country = await getCountryFromIP(ip);
    const cacheStats = getIPCacheStats();
    
    res.status(200).json({
      success: true,
      data: {
        ip,
        country,
        cached: cacheStats.keys > 0 // Simple check if cache has entries
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @swagger
 * /signup-analytics/click:
 *   post:
 *     summary: Track signup button click
 *     tags: [SignupAnalytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               sessionId:
 *                 type: string
 *               type:
 *                 type: string
 *                 description: Type of signup form that was clicked (e.g., 'homepage', 'navbar', 'popup')
 *     responses:
 *       201:
 *         description: Click tracked successfully
 *       400:
 *         description: Missing required fields
 *       200:
 *         description: Request processed
 */
export const trackSignupClick = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, type } = req.body;

    if (!type) {
      res.status(400).json({ 
        success: false, 
        message: 'Signup form type is required' 
      });
      return;
    }

    // Extract real IP address (behind proxy/CDN safe)
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = extractClientIP(forwarded, req.socket.remoteAddress || req.ip || '');

    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDeviceType(userAgent);

    const country = await getCountryFromIP(ipAddress);

    const analytics = signupAnalyticsRepository.create({
      sessionId: sessionId || undefined,
      ipAddress,
      country: country || undefined,
      deviceType,
      type,
    });

    await signupAnalyticsRepository.save(analytics);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to track signup click:', error);
    res.status(200).json({ success: true }); // don't block user experience
  }
};


/**
 * @swagger
 * /signup-analytics/data:
 *   get:
 *     summary: Get signup analytics data
 *     tags: [SignupAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of days to include (legacy parameter)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [last24hours, last7days, last30days, custom]
 *         description: Time period filter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export const getSignupAnalyticsData = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Get date range from query params
    let startDate: Date;
    let endDate: Date = new Date();

    // Support both legacy 'days' parameter and new time range filtering
    if (req.query.days) {
      // Legacy API - use days parameter
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(req.query.days as string));
    } else if (req.query.period) {
      // New API - use period parameter
      const period = req.query.period as string;
      startDate = new Date();
      
      switch (period) {
        case 'last24hours':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case 'last7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'custom':
          if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate as string);
            endDate = new Date(req.query.endDate as string);
            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);
          } else {
            // Fallback to last 30 days if custom dates not provided
            startDate.setDate(startDate.getDate() - 30);
          }
          break;
        default:
          // Default to last 30 days
          startDate.setDate(startDate.getDate() - 30);
      }
    } else {
      // Default to last 30 days if no parameters provided
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Total clicks (excluding signup-modal to avoid double counting)
    const totalClicks = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'count')
      .where('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .getRawOne()
      .then(result => parseInt(result?.count || '0'));
    
    // Clicks in the selected period (excluding signup-modal to avoid double counting)
    const periodClicks = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'count')
      .where('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .getRawOne()
      .then(result => parseInt(result?.count || '0'));
    
    // Unique sessions (excluding signup-modal to avoid double counting) - FILTERED BY DATE RANGE
    const uniqueSessions = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.sessionId)', 'count')
      .where('analytics.sessionId IS NOT NULL')
      .andWhere('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .getRawOne();
    
    // Clicks by country (excluding signup-modal to avoid double counting) - FILTERED BY DATE RANGE
    const clicksByCountry = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.country IS NOT NULL')
      .andWhere('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .groupBy('analytics.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Clicks by device type (excluding signup-modal to avoid double counting) - FILTERED BY DATE RANGE
    const clicksByDevice = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.deviceType', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.deviceType IS NOT NULL')
      .andWhere('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .groupBy('analytics.deviceType')
      .orderBy('count', 'DESC')
      .getRawMany();
    
    // Clicks by day (excluding signup-modal to avoid double counting)
    const clicksByDay = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DATE(analytics.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .groupBy('DATE(analytics.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();
    
    // Clicks by type (excluding signup-modal to avoid double counting) - FILTERED BY DATE RANGE
    const clicksByType = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('analytics.type != :excludeType', { excludeType: 'signup-modal' })
      .groupBy('analytics.type')
      .orderBy('count', 'DESC')
      .getRawMany();
    
    res.status(200).json({
      success: true,
      data: {
        totalClicks,
        periodClicks,
        uniqueSessions: uniqueSessions?.count || 0,
        clicksByCountry,
        clicksByDevice,
        clicksByDay,
        clicksByType
      }
    });
  } catch (error) {
    next(error);
  }
};
