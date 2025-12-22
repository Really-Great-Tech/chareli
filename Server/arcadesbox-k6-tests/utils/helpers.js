import { Trend, Rate } from 'k6/metrics';

export const homepageLatency = new Trend('homepage_latency');
export const gameLaunchLatency = new Trend('game_launch_latency');
export const analyticsLatency = new Trend('analytics_latency');

export const errorRate = new Rate('errors');
