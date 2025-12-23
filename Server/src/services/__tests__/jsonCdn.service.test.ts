/**
 * Unit tests for JSON CDN Service
 *
 * Note: These are basic tests that verify the service exports and structure.
 * Integration tests with actual database would be more comprehensive but
 * require test database setup.
 */

describe('JsonCdnService', () => {
  it('should be importable', () => {
    // This test verifies the module can be required/loaded
    const { jsonCdnService } = require('../jsonCdn.service');
    expect(jsonCdnService).toBeDefined();
  });

  it('should have required methods', () => {
    const { jsonCdnService } = require('../jsonCdn.service');
    expect(typeof jsonCdnService.isEnabled).toBe('function');
    expect(typeof jsonCdnService.getCdnUrl).toBe('function');
    expect(typeof jsonCdnService.getMetrics).toBe('function');
    expect(typeof jsonCdnService.invalidateCache).toBe('function');
    expect(typeof jsonCdnService.generateAllJsonFiles).toBe('function');
    expect(typeof jsonCdnService.generateGameDetailJson).toBe('function');
  });

  it('should return metrics object with expected properties', () => {
    const { jsonCdnService } = require('../jsonCdn.service');
    const metrics = jsonCdnService.getMetrics();

    expect(metrics).toHaveProperty('generationCount');
    expect(metrics).toHaveProperty('lastGenerationDuration');
    expect(metrics).toHaveProperty('failureCount');
    expect(metrics).toHaveProperty('isGenerating');
    expect(metrics).toHaveProperty('config');

    expect(typeof metrics.generationCount).toBe('number');
    expect(typeof metrics.lastGenerationDuration).toBe('number');
    expect(typeof metrics.failureCount).toBe('number');
    expect(typeof metrics.isGenerating).toBe('boolean');
    expect(typeof metrics.config).toBe('object');
  });

  it('should generate proper CDN URLs when enabled', () => {
    const { jsonCdnService } = require('../jsonCdn.service');

    if (jsonCdnService.isEnabled()) {
      const url = jsonCdnService.getCdnUrl('test.json');
      expect(url).toContain('/cdn/test.json');
    } else {
      const url = jsonCdnService.getCdnUrl('test.json');
      expect(url).toBe('');
    }
  });

  it('should handle invalidateCache with empty array', async () => {
    const { jsonCdnService } = require('../jsonCdn.service');

    // Should not throw
    await expect(jsonCdnService.invalidateCache([])).resolves.not.toThrow();
  });
});
