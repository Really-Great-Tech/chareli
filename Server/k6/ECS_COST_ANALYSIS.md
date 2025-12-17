# ECS Infrastructure Cost Analysis for Load Testing

## Executive Summary

**Infrastructure**: ECS with Autoscaling + Supabase Micro + ALB
**Test Load**: 5,000 - 20,000 concurrent users
**Estimated Total Cost**: **$15-45 per full test run**
**Primary Cost Drivers**: ECS task scaling, data transfer, ALB processing

---

## Current Infrastructure Capacity

### Supabase Micro Instance

**✅ MUCH BETTER than Nano!**

| Metric | Supabase Micro | Notes |
|--------|----------------|-------|
| **Direct Connections** | 120 | 2x nano capacity |
| **Pooler Connections** | **1,000** | 5x nano capacity! 🎉 |
| **Compute** | Dedicated resources | More predictable performance |
| **Storage IOPS** | Higher limits | Better query performance |
| **Monthly Cost** | $25/month | Already budgeted |

**Connection Math at Scale:**
```
20,000 concurrent users ÷ 1,000 pooler connections = 20 users per connection
```

This is **MUCH more achievable** than the 100:1 ratio with nano!

**Expected Database Performance:**

| VU Count | Pooler Usage | Expected Performance |
|----------|--------------|----------------------|
| 100      | < 1%         | ✅ Excellent         |
| 1,000    | ~5%          | ✅ Excellent         |
| 5,000    | 20-30%       | ✅ Very Good         |
| 10,000   | 40-60%       | ✅ Good              |
| 15,000   | 60-80%       | ✅ Good, monitor     |
| 20,000   | 80-100%      | ⚠️ Near limit        |
| 25,000   | >100%        | ❌ Connection queuing |

**Critical Difference**: With Micro, you should be able to **reach 20,000 VUs** before hitting database limits!

---

## ECS Infrastructure Cost Breakdown

### Assumptions (Typical Setup)

Based on common ECS configurations:

**ECS Service Configuration:**
- Task Definition: ~0.5 vCPU, 1 GB RAM per task
- Launch Type: Fargate or EC2
- Auto-scaling: Target tracking on CPU (70%) or Request Count
- Min tasks: 2-5
- Max tasks: 50-100 (for safety)

### Cost Model 1: ECS on Fargate

**Fargate Pricing (us-east-1):**
- vCPU: $0.04048 per vCPU hour
- Memory: $0.004445 per GB hour

**Per Task Cost:**
```
Task (0.5 vCPU, 1 GB RAM) = $0.02024 + $0.004445 = $0.024685/hour
```

**Scaling Pattern Under Load:**

| VU Count | Requests/sec | Tasks Needed | Cost/Hour | Total Cost (30 min test) |
|----------|--------------|--------------|-----------|--------------------------|
| 100      | ~50          | 3-5          | $0.07-0.12 | $0.04-0.06 |
| 1,000    | ~500         | 10-15        | $0.25-0.37 | $0.12-0.19 |
| 5,000    | ~2,500       | 25-35        | $0.62-0.86 | $0.31-0.43 |
| 10,000   | ~5,000       | 40-60        | $0.99-1.48 | $0.50-0.74 |
| 15,000   | ~7,500       | 55-80        | $1.36-1.98 | $0.68-0.99 |
| 20,000   | ~10,000      | 70-100       | $1.73-2.47 | $0.86-1.23 |

**Full Test Suite Cost (Fargate):**
- Total duration: ~2-3 hours (all 6 tests)
- Average task count: 30-50 tasks
- **Estimated cost: $3-5 for ECS tasks**

### Cost Model 2: ECS on EC2 (if using EC2 launch type)

**Assumptions:**
- Instance type: t3.large ($0.0832/hr On-Demand, ~$0.025/hr Spot)
- Tasks per instance: 8-10
- Auto Scaling Group scales instances

**Scaling Pattern:**

| VU Count | Tasks Needed | Instances (Spot) | Cost/Hour | Total Cost (30 min) |
|----------|--------------|------------------|-----------|---------------------|
| 1,000    | 10-15        | 2                | $0.05     | $0.03               |
| 5,000    | 25-35        | 4                | $0.10     | $0.05               |
| 10,000   | 40-60        | 6-7              | $0.15-0.18 | $0.08-0.09         |
| 15,000   | 55-80        | 8-10             | $0.20-0.25 | $0.10-0.13         |
| 20,000   | 70-100       | 10-12            | $0.25-0.30 | $0.13-0.15         |

**Full Test Suite Cost (EC2 Spot):**
- **Estimated cost: $0.50-1.00 for ECS instances**

---

## Additional Infrastructure Costs

### Application Load Balancer (ALB)

**ALB Pricing:**
- **Fixed cost**: $0.0225 per hour (~$16.20/month)
- **LCU Usage**: $0.008 per LCU-hour

**LCU Metrics** (billed on highest of):
- New connections/sec: 25 per LCU
- Active connections: 3,000 per LCU
- Processed bytes: 1 GB per LCU
- Rule evaluations: 1,000 per LCU

**Under Load Testing:**

| VU Count | New Conn/sec | Active Conns | LCUs Needed | LCU Cost/Hour | Total Cost (30 min) |
|----------|--------------|--------------|-------------|---------------|---------------------|
| 1,000    | ~100         | ~1,000       | 4           | $0.032        | $0.016              |
| 5,000    | ~500         | ~5,000       | 10-15       | $0.08-0.12    | $0.04-0.06          |
| 10,000   | ~1,000       | ~10,000      | 20-30       | $0.16-0.24    | $0.08-0.12          |
| 20,000   | ~2,000       | ~20,000      | 40-50       | $0.32-0.40    | $0.16-0.20          |

**Full Test Suite ALB Cost:**
- Fixed: $0.05 (2-3 hours)
- LCU charges: **$1-3**
- **Total: $1.05-3.05**

### Data Transfer Costs

**Pricing:**
- First 10 TB/month out to internet: $0.09 per GB
- Data transfer between AZs: $0.01 per GB
- Data transfer within same AZ: Free

**Assumptions:**
- Average request size: 5 KB
- Average response size: 50 KB
- Total per request: 55 KB

**Data Transfer Calculation:**

| VU Count | Requests/30min | Total Data (GB) | Internet Cost | Inter-AZ Cost | Total Cost |
|----------|----------------|-----------------|---------------|---------------|------------|
| 1,000    | ~300,000       | ~17 GB          | $1.53         | $0.17         | $1.70      |
| 5,000    | ~1,500,000     | ~83 GB          | $7.47         | $0.83         | $8.30      |
| 10,000   | ~3,000,000     | ~165 GB         | $14.85        | $1.65         | $16.50     |
| 20,000   | ~6,000,000     | ~330 GB         | $29.70        | $3.30         | $33.00     |

**Full Test Suite Data Transfer:**
- Total requests: ~5-10 million
- Total data: ~300-500 GB
- **Estimated cost: $27-45**

### CloudWatch Costs

**Pricing:**
- Logs ingestion: $0.50 per GB
- Logs storage: $0.03 per GB/month
- Custom metrics: $0.30 per metric/month
- API requests: $0.01 per 1,000 requests

**During Load Testing:**

| Component | Usage | Cost |
|-----------|-------|------|
| Container logs | 5-10 GB | $2.50-5.00 |
| ALB access logs | 2-5 GB | $1.00-2.50 |
| Custom metrics | ~50 metrics | $0.50 |
| API requests | ~100k requests | $1.00 |
| **Total** | | **$5-9** |

### Supabase Micro

**Fixed Monthly Cost**: $25/month

**During Load Testing:**
- No additional charges (included in plan)
- Compute and storage included
- Connection pooling included

**Additional Cost**: $0 (already paying monthly fee)

---

## Total Cost Summary

### Per Test Run (30 minutes at 20k VUs)

| Component | Cost Range |
|-----------|-----------|
| ECS Tasks (Fargate) | $0.86-1.23 |
| OR ECS Instances (EC2 Spot) | $0.13-0.15 |
| ALB (LCU charges) | $0.16-0.20 |
| Data Transfer | $30-33 |
| CloudWatch | $0.50-1.00 |
| Supabase | $0 |
| **Total (Fargate)** | **$31.52-35.43** |
| **Total (EC2 Spot)** | **$30.79-34.35** |

### Full Test Suite (All 6 Tests, ~3 hours)

| Component | Cost Range |
|-----------|-----------|
| ECS Tasks (Fargate) | $3-5 |
| OR ECS Instances (EC2 Spot) | $0.50-1.00 |
| ALB (LCU charges) | $1-3 |
| Data Transfer | $40-60 |
| CloudWatch | $5-9 |
| k6 Runner (EC2) | $0.60-0.80 |
| Supabase | $0 |
| **Total (Fargate)** | **$49.60-77.80** |
| **Total (EC2 Spot)** | **$47.10-73.80** |

### Cost Breakdown by Test Type

| Test Type | Duration | VUs | Estimated Cost |
|-----------|----------|-----|----------------|
| Smoke | 1 min | 10 | < $0.10 |
| Single endpoint (load) | 25 min | 5k-20k | $25-35 |
| Comprehensive | 30 min | 5k-20k | $30-40 |
| Full suite | 180 min | 5k-20k | $47-78 |

---

## Detailed Scaling Patterns

### ECS Auto-Scaling Behavior

**Typical Configuration:**
```json
{
  "TargetTrackingScaling": {
    "TargetValue": 70.0,
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization",
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }
}
```

**Scaling Timeline Example (20k VU test):**

```
T+0:00  - Test starts, 2 baseline tasks
T+0:30  - CPU spikes to 85%, autoscaling triggered
T+1:30  - Scaled to 10 tasks (scale-out cooldown)
T+3:00  - 5k VUs reached, 25 tasks running
T+8:00  - 10k VUs reached, 50 tasks running
T+13:00 - 20k VUs sustained, 80-100 tasks running
T+23:00 - Ramp down starts
T+25:00 - Test complete, scale-in cooldown begins
T+30:00 - Scaled down to 50 tasks
T+35:00 - Scaled down to 25 tasks
T+40:00 - Scaled down to 10 tasks
T+50:00 - Back to 2 baseline tasks
```

**Key Observations:**
- Scale-out is fast (60s cooldown)
- Scale-in is slow (300s cooldown) - you'll pay for extra capacity during ramp-down
- Peak capacity maintained for ~10 minutes during sustained load

### Request Distribution Pattern

**At 20,000 concurrent VUs:**

**Request Types (from comprehensive test):**
- 40% - Game listings/searches (cacheable, fast)
- 30% - Game details (cacheable, medium)
- 15% - User operations (session-based, fast)
- 10% - Analytics tracking (write-heavy, medium)
- 5% - Admin/auth (CPU-intensive, slower)

**Requests Per Second:**
```
20,000 VUs × 2 requests/minute avg = 666 RPS
```

**Per-Task Load:**
```
666 RPS ÷ 80 tasks = ~8-10 RPS per task
```

This is reasonable for typical Express.js applications.

### Database Connection Pattern

**Connection Pool Configuration (typical):**
```javascript
{
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

**With 80 ECS tasks:**
```
80 tasks × 10 max connections = 800 potential connections
```

**But with Supabase pooler:**
- All 800 app connections go through pooler
- Pooler manages 1,000 connection limit
- With good query performance (<100ms), you'll be fine

**Connection Usage Pattern:**

| Phase | ECS Tasks | App Conns | Pooler Usage | Status |
|-------|-----------|-----------|--------------|--------|
| Baseline | 2 | 20 | <2% | ✅ |
| Ramp-up (5k) | 25 | 250 | 25% | ✅ |
| Mid-load (10k) | 50 | 500 | 50% | ✅ |
| Peak (20k) | 80 | 800 | 80% | ✅ Good |
| Sustained | 80 | 600-800 | 60-80% | ✅ |

### Network Traffic Pattern

**Bandwidth Requirements:**

| VU Count | Requests/sec | Bandwidth (Mbps) | ALB Impact |
|----------|--------------|------------------|------------|
| 5,000    | ~170         | ~75 Mbps         | Low |
| 10,000   | ~330         | ~145 Mbps        | Medium |
| 15,000   | ~500         | ~220 Mbps        | Medium-High |
| 20,000   | ~666         | ~290 Mbps        | High |

**Traffic Spikes:**
- Initial connection surge: 2-3x normal RPS
- Cache warming: Higher data transfer initially
- WebSocket connections: Persistent, low bandwidth

---

## Cost Optimization Strategies

### 1. Use EC2 Spot Instances for ECS

**Savings**: 70-80% on compute costs

```
Fargate: $3-5 for full suite
EC2 Spot: $0.50-1.00 for full suite
Savings: $2.50-4.00 per test run
```

**Tradeoff**: Spot interruption risk (low for short tests)

### 2. Run Tests During Off-Peak Hours

**Savings**: Reduce impact on production traffic, may reduce autoscaling

**Additional Benefit**:
- Lower baseline task count to interfere with
- More predictable results
- Easier to identify test-induced issues

### 3. Optimize Data Transfer

**Reduce Response Sizes:**
- Enable compression (gzip/brotli)
- Limit unnecessary fields in API responses
- Use pagination effectively

**Potential Savings**: 30-50% on data transfer costs

```
Before: 50 KB average response
After: 25 KB average response
Savings: ~$15-20 per full test suite
```

### 4. Strategic Test Sequencing

**Instead of full suite in one run:**
```
Week 1: Smoke tests only (<$1)
Week 2: Individual endpoint tests ($5-10)
Week 3: Gradual ramp tests ($10-15)
Week 4: Full comprehensive test ($30-40)
```

**Total phased cost**: $46-66
**vs Single full run**: $47-78

**Benefit**: Identify issues early, avoid costly full tests if problems found

### 5. Cache Warming

**Pre-populate Redis cache before testing:**
```bash
# Warm critical caches
curl https://api.example.com/games?limit=100
curl https://api.example.com/categories
```

**Impact:**
- Reduced database load
- Better sustained performance
- May reduce task scaling needs by 10-20%

**Savings**: $3-5 per test run

### 6. CloudWatch Log Retention

**Adjust log retention:**
```
Default: 365 days
For load tests: 7 days
```

**Savings**: $1-2 per test on storage costs

---

## Risk Assessment

### High-Cost Scenarios

**Scenario 1: Runaway Auto-Scaling**
- **Trigger**: Misconfigured thresholds
- **Impact**: Scale to max tasks (100+) unnecessarily
- **Cost**: $5-10/hour additional
- **Mitigation**: Set max task limit, monitor closely

**Scenario 2: Data Transfer Spike**
- **Trigger**: Large response payloads
- **Impact**: 2-3x expected data transfer
- **Cost**: $50-100 additional
- **Mitigation**: Monitor response sizes, enable compression

**Scenario 3: Database Query Performance**
- **Trigger**: Missing indexes, slow queries
- **Impact**: Connection pool saturation, increased latency
- **Cost**: Longer test duration, more ECS task-hours
- **Mitigation**: Run EXPLAIN on queries, add indexes

### Cost Control Measures

**Set AWS Budget Alerts:**
```
Alert 1: $25 (50% of expected)
Alert 2: $50 (100% of expected)
Alert 3: $75 (150% of expected - STOP TEST)
```

**ECS Task Limits:**
```json
{
  "maximumCount": 80,
  "minimumCount": 2
}
```

**Test Duration Limits:**
```bash
# In k6 config
maxDuration: '45m'  # Safety cutoff
```

---

## Monitoring Checklist

### Before Test

- [ ] Check baseline ECS task count
- [ ] Verify auto-scaling configuration
- [ ] Set AWS budget alerts
- [ ] Enable detailed CloudWatch monitoring
- [ ] Warm caches

### During Test

- [ ] Monitor ECS task count (real-time)
- [ ] Monitor ALB request count and latency
- [ ] Monitor Supabase connection pool (dashboard)
- [ ] Monitor CloudWatch costs (AWS Billing)
- [ ] Monitor data transfer (CloudWatch)
- [ ] Watch for error rate spikes

### After Test

- [ ] Review final AWS bill breakdown
- [ ] Analyze ECS scaling pattern
- [ ] Check Supabase connection metrics
- [ ] Document cost per VU level
- [ ] Identify optimization opportunities

---

## Conclusion

### Key Findings

1. **Supabase Micro is MUCH Better**: 1,000 pooler connections means you should reach 20k VUs without database limits
2. **Primary Cost**: Data transfer ($40-60) is the biggest expense
3. **Total Cost**: $47-78 for full test suite (all 6 tests)
4. **Per-Test Cost**: $30-40 for single comprehensive test

### Recommendations

1. **Start Small**: Begin with smoke tests and 1k VUs to validate setup
2. **Use EC2 Spot**: If on EC2 launch type, use Spot instances for 70% savings
3. **Enable Compression**: Reduce data transfer costs by 30-50%
4. **Phased Approach**: Incrementally increase load to avoid runaway costs
5. **Set Budget Alerts**: $25, $50, $75 thresholds

### Cost-Benefit Analysis

**Investment**: ~$50-80 for comprehensive load testing
**Value**:
- Identify breaking points before production issues
- Validate infrastructure for Black Friday/peak load
- Prevent revenue loss from downtime ($1000s)
- Optimize resource allocation

**ROI**: High - one prevented outage pays for months of testing

---

**Last Updated**: 2025-12-17
**Infrastructure**: ECS + Supabase Micro
**Test Range**: 5,000-20,000 VUs
