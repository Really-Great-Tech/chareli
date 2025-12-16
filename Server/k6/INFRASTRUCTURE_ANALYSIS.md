# Infrastructure Capacity & Cost Analysis for Load Testing

## Executive Summary

This document analyzes the infrastructure capacity and estimated costs for load testing the Chareli gaming platform with 5,000-20,000 concurrent users.

### Key Findings

- ⚠️ **Supabase Nano Capacity Concern**: Connection pool limit (200 clients) will be the primary bottleneck
- 💰 **Estimated Total Cost**: $0.70-$1.00 for complete test suite
- 🎯 **Recommended Approach**: Gradual ramp-up with monitoring to identify breaking points
- 📊 **EC2 Recommendation**: c5.4xlarge Spot Instance (~$0.20/hr)

---

## Current Infrastructure Analysis

### Database: Supabase Nano (Managed PostgreSQL)

**Limitations:**
- **Direct Connections**: 60 max
- **Connection Pooler Clients**: 200 max (Supavisor)
- **Compute**: Shared infrastructure (nano tier)
- **Storage**: Limited IOPS for free tier

**Connection Math at Scale:**
```
20,000 concurrent users ÷ 200 pooler clients = 100 users per connection
```

This requires:
1. ✅ Excellent connection pooling implementation
2. ✅ Fast query execution (< 100ms avg)
3. ⚠️ No connection leaks
4. ⚠️ Efficient query patterns

###Expected Behavior Under Load

| VU Count | Connection Pool Usage | Expected Performance |
|----------|----------------------|----------------------|
| 100      | < 5%                | ✅ Excellent         |
| 1,000    | ~20%                | ✅ Very Good         |
| 5,000    | ~40-60%             | ✅ Good, monitor     |
| 10,000   | ~80-100%            | ⚠️ Near limit        |
| 15,000   | >100%               | ❌ Connection queuing |
| 20,000   | >100%               | ❌ Heavy queuing/errors |

**Critical Thresholds:**
- **Green Zone**: 0-5,000 VUs → Expected to work well
- **Yellow Zone**: 5,000-10,000 VUs → Monitor closely, may see degradation
- **Red Zone**: 10,000-20,000 VUs → Likely to hit connection pool limits

### Application Server (ECS/EC2)

Based on typical Node.js application patterns:

**Assumptions:**
- Running on AWS ECS or EC2
- Node.js with Express
- Connection pooling configured

**Capacity Considerations:**
- Each API container can handle ~500-1000 concurrent connections efficiently
- For 20k users, you'll need: **20-40 containers** (assuming good load distribution)

**Cost Impact**: Your existing infrastructure should handle the API layer if properly scaled

### Redis Cache

**Expected Performance:**
- ✅ Redis can easily handle 100k+ ops/sec
- ✅ Not a bottleneck for this scale
- ✅ Will help reduce database load

---

## Load Testing Infrastructure Requirements

### EC2 Instance for Running k6 Tests

k6 resource requirements depend on script complexity and VU count:

**Resource Usage per k6 Instance:**
- Simple script: ~5-10 MB RAM per VU
- Complex script: ~20-40 MB RAM per VU
- CPU: Scales with VUs and request rate

**For 20,000 VUs:**
- Memory needed: 20,000 × 20 MB = ~400 GB (impractical for single instance)
- **Solution**: Distributed execution or realistic traffic patterns

**Revised Recommendation:**
Use realistic traffic patterns that simulate 20k users but don't maintain all connections simultaneously:
- **c5.4xlarge** (16 vCPU, 32 GB) → Can simulate 10k-15k concurrent active requests
- **c5.9xlarge** (36 vCPU, 72 GB) → Can simulate 20k+ concurrent active requests

### Instance Comparison

| Instance Type | vCPU | Memory | Network Bandwidth | Max VUs (Realistic) | On-Demand $/hr | Spot $/hr (avg) |
|--------------|------|--------|-------------------|---------------------|----------------|-----------------|
| c5.xlarge    | 4    | 8 GB   | Up to 10 Gbps    | 2k-4k              | $0.17          | ~$0.05          |
| c5.2xlarge   | 8    | 16 GB  | Up to 10 Gbps    | 5k-8k              | $0.34          | ~$0.10          |
| c5.4xlarge   | 16   | 32 GB  | Up to 10 Gbps    | 10k-15k            | $0.68          | ~$0.20          |
| c5.9xlarge   | 36   | 72 GB  | 10 Gbps          | 20k+               | $1.53          | ~$0.46          |

**💡 Cost-Saving Tip**: Use Spot Instances for 70-90% savings

---

## Detailed Cost Breakdown

### Test Execution Costs

**Scenario: Full Test Suite (all tests, load mode)**

| Component | Configuration | Duration | Cost |
|-----------|--------------|----------|------|
| k6 Runner (EC2) | c5.4xlarge Spot | 3-4 hours | $0.60-0.80 |
| Data Transfer (Outbound) | API requests | 3-4 hours | < $0.10 |
| Supabase | Nano (free tier) | 3-4 hours | $0.00 |
| CloudWatch Logs | Additional logging | 3-4 hours | < $0.05 |
| **TOTAL** | | | **$0.70-$1.00** |

### Cost Per Test Type

| Test Mode | Duration | VU Range | Estimated Cost |
|-----------|----------|----------|----------------|
| Smoke     | 1 min    | 10       | < $0.01        |
| Load      | 25 min   | 5k-20k   | $0.15-0.25     |
| Stress    | 20 min   | Up to 40k | $0.20-0.30    |
| Spike     | 10 min   | Spikes to 20k | $0.05-0.10  |
| Comprehensive | 30 min | 5k-20k  | $0.20-0.30     |

### Monthly Cost if Running Regularly

**Weekly regression testing** (1x per week):
- $0.80 per run × 4 weeks = **$3.20/month**

**Daily smoke tests** (automated):
- $0.01 per run × 30 days = **$0.30/month**

**Total monthly cost**: **~$3.50/month** 🎯

---

## Infrastructure Bottleneck Analysis

### Predicted Bottlenecks (in order of likelihood)

1. **Supabase Connection Pool** (Most Likely)
   - Limit: 200 pooler clients
   - Impact: Connection queuing, increased latency
   - Symptoms: Timeouts, "too many connections" errors
   - Mitigation: Upgrade to Supabase Pro (400+ connections)

2. **Database Query Performance** (Likely)
   - Impact: Slow response times under load
   - Symptoms: Increasing p95/p99 latencies
   - Mitigation: Query optimization, indexes, caching

3. **API Container CPU** (Possible)
   - Impact: Request processing slowdown
   - Symptoms: High CPU usage, slow responses
   - Mitigation: Horizontal scaling (more containers)

4. **Network Bandwidth** (Unlikely)
   - Impact: Request/response delays
   - Symptoms: Network saturation
   - Mitigation: Larger instance types, better placement

### Risk Matrix

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| DB connection exhaustion | High | High | Monitor pool usage; upgrade if >80% |
| Slow DB queries | Medium | High | Optimize before testing |
| API scaling lag | Medium | Medium | Pre-scale containers |
| Test runner resource limit | Low | Medium | Use c5.4xlarge or larger |
| Cost overrun | Low | Low | Use Spot instances |

---

## Recommendations

### Pre-Test Infrastructure Preparation

1. **Database Connection Monitoring** ✅
   ```sql
   -- Monitor active connections in Supabase
   SELECT count(*) FROM pg_stat_activity;
   ```
   Set up alerts if >80% capacity (160/200 connections)

2. **API Auto-Scaling** ✅
   - Configure ECS auto-scaling
   - Target: 70% CPU utilization
   - Min containers: 5
   - Max containers: 40

3. **Cache Warming** ✅
   - Pre-populate Redis cache with frequently accessed data
   - Run smoke test to warm up caches

### TestExecution Strategy

**Phase 1: Validation** (Cost: ~$0.05)
- Run smoke test (10 VUs)
- Verify all endpoints work
- Check authentication flow

**Phase 2: Baseline** (Cost: ~$0.10)
- Run with 100 VUs
- Establish performance baseline
- Verify monitoring is working

**Phase 3: Gradual Ramp** (Cost: ~$0.30)
- 500 VUs → 1,000 → 2,000 → 5,000
- Monitor connection pool usage
- Watch for performance degradation

**Phase 4: Full Load** (Cost: ~$0.25)
- Only proceed if Phase 3 shows good metrics
- 5,000 → 10,000 → 15,000 → 20,000
- Be prepared to stop if errors spike

**Phase 5: Stress Test** (Cost: ~$0.30, Optional)
- Push beyond 20k to find absolute limits
- Helps plan future scaling

**Total estimated cost**: **$1.00-$1.50**

### Infrastructure Upgrade Triggers

**Upgrade Supabase to Pro/Micro if:**
- Connection pool usage > 80% at any VU level
- Error rate > 1% due to connection issues
- p95 latency > 2 seconds consistently

**Upgrade costs:**
- Supabase Micro: $25/month (500 connections)
- Supabase Pro: $99/month (1000 connections)

**ROI Analysis:**
If you need to support 10k+ concurrent users in production:
- Connection pool becomes critical
- $25-99/month is justified for reliability
- Prevents revenue loss from downtime

---

## Monitoring Checklist During Tests

### Supabase Dashboard
- [ ] Active connections count
- [ ] Connection pool usage %
- [ ] Query performance (slow queries)
- [ ] Database CPU/memory usage

### CloudWatch (if applicable)
- [ ] ALB request count
- [ ] ALB target response time
- [ ] ECS CPU/memory utilization
- [ ] ECS task count (auto-scaling)

### k6 Metrics
- [ ] HTTP request duration (p95, p99)
- [ ] HTTP request failure rate
- [ ] VUs (current load)
- [ ] Iterations (requests completed)

### Application Logs
- [ ] Error patterns
- [ ] Timeout warnings
- [ ] Connection pool warnings

---

## Conclusion

**Load testing 20,000 concurrent users is feasible with your current Supabase nano setup for short-duration tests**, but you'll likely hit connection pool limits between 10k-15k users.

**Total cost is minimal** (~$0.70-$1.00), making this a very cost-effective way to:
1. ✅ Identify actual breaking points
2. ✅ Validate performance assumptions
3. ✅ Make data-driven infrastructure decisions
4. ✅ Plan future scaling needs

**Recommended next steps:**
1. Run smoke test (free, validates setup)
2. Gradually increase load (cheap, low risk)
3. Monitor Supabase metrics closely
4. Make upgrade decision based on data, not assumptions

---

**Document Version**: 1.0
**Last Updated**: 2025-12-16
**Author**: Load Testing Analysis
