import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { Between } from 'typeorm';
import NodeCache from 'node-cache';

// Initialize cache with 24h TTL
const ipCache = new NodeCache({ stdTTL: 86400 });

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


function isPrivateIP(ip: string): boolean {
  return ip === '127.0.0.1' || 
         ip === '::1' || 
         ip === 'localhost' || 
         ip.startsWith('192.168.') || 
         ip.startsWith('10.') || 
         ip.startsWith('172.16.');
}

export async function getCountryFromIP(ipAddress: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = ipCache.get<string>(ipAddress);
    if (cached) {
      console.log('IP cache hit:', ipAddress);
      return cached;
    }

    // Handle private/local IPs
    if (isPrivateIP(ipAddress)) {
      return 'Local';
    }

    console.log('Fetching country for IP:', ipAddress);
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json() as {
      error?: string;
      country_name?: string;
    };

    if (data.error) {
      console.error('IP API error:', data.error);
      return null;
    }

    // Cache successful results
    if (data.country_name) {
      ipCache.set(ipAddress, data.country_name);
    }

    return data.country_name || null;
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return null;
  }
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
    
    res.status(200).json({
      success: true,
      data: {
        ip,
        country,
        cached: ipCache.has(ip)
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
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded || req.socket.remoteAddress || req.ip || '');

    console.log('Detected IP address:', ipAddress); 

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
