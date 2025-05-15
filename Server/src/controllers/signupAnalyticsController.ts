import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { Between } from 'typeorm';

const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);

/**
 * Simple device type detection from user agent
 * @param userAgent The user agent string
 * @returns Device type: 'mobile', 'tablet', or 'desktop'
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  // Check for tablets first (some tablets also identify as mobile)
  if (
    ua.includes('ipad') || 
    ua.includes('tablet') || 
    (ua.includes('android') && !ua.includes('mobi'))
  ) {
    return 'tablet';
  }
  
  // Check for mobile devices
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
  
  // Default to desktop
  return 'desktop';
}

/**
 * Get country from IP address using ip-api.com
 * @param ipAddress The IP address
 * @returns Country name or null if not found
 */
async function getCountryFromIP(ipAddress: string): Promise<string | null> {
  try {
    // Skip for localhost or private IPs
    if (
      ipAddress === '127.0.0.1' || 
      ipAddress === 'localhost' || 
      ipAddress.startsWith('192.168.') || 
      ipAddress.startsWith('10.') || 
      ipAddress.startsWith('172.16.')
    ) {
      return 'Local';
    }
    
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,status`);
    const data = await response.json() as { status: string; country: string };
    return data.status === 'success' ? data.country : null;
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return null;
  }
}

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
    
    // Validate required fields
    if (!type) {
      res.status(400).json({ 
        success: false, 
        message: 'Signup form type is required' 
      });
      return;
    }
    
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Detect device type
    const deviceType = detectDeviceType(userAgent);
    
    // Get country from IP
    const country = await getCountryFromIP(ipAddress);
    
    // Create analytics entry
    const analytics = signupAnalyticsRepository.create({
      sessionId: sessionId || undefined,
      ipAddress,
      country: country || undefined,
      deviceType,
      type // Store the form type
    });
    
    await signupAnalyticsRepository.save(analytics);
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to track signup click:', error);
    // Don't block the user experience
    res.status(200).json({ success: true });
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
 *         description: Number of days to include (default 30)
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
    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (req.query.days ? parseInt(req.query.days as string) : 30));
    
    // Total clicks
    const totalClicks = await signupAnalyticsRepository.count();
    
    // Clicks in the selected period
    const periodClicks = await signupAnalyticsRepository.count({
      where: {
        createdAt: Between(startDate, endDate)
      }
    });
    
    // Unique sessions
    const uniqueSessions = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.sessionId)', 'count')
      .where('analytics.sessionId IS NOT NULL')
      .getRawOne();
    
    // Clicks by country
    const clicksByCountry = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.country IS NOT NULL')
      .groupBy('analytics.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Clicks by device type
    const clicksByDevice = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.deviceType', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.deviceType IS NOT NULL')
      .groupBy('analytics.deviceType')
      .orderBy('count', 'DESC')
      .getRawMany();
    
    // Clicks by day
    const clicksByDay = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DATE(analytics.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(analytics.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();
    
    // Clicks by type
    const clicksByType = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.type', 'type')
      .addSelect('COUNT(*)', 'count')
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
