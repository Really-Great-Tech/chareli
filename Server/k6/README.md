# k6 Load Testing Suite

Comprehensive load testing infrastructure for the Chareli gaming platform using [k6](https://k6.io/), designed to test 5,000-20,000 concurrent users across all application endpoints.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [EC2 Instance Requirements](#ec2-instance-requirements)
- [Infrastructure Capacity Analysis](#infrastructure-capacity-analysis)
- [Interpreting Results](#interpreting-results)
- [Best Practices](#best-practices)

## Overview

This load testing suite provides:

- **Comprehensive coverage** of all API endpoints (read and write operations)
- **Multiple test scenarios**: smoke, load, stress, and spike tests
- **Realistic user behavior simulation** with weighted journey distributions
- **Custom metrics** for tracking specific application performance
- **Detailed reporting** in JSON and HTML formats
- **Performance threshold validation** against defined SLAs

## Test Coverage

### Test Scripts

| Test Script | Endpoints Covered | Primary Focus |
|------------|-------------------|---------------|
| `auth-load-test.js` | `/auth/*` | Registration, login, OTP, password reset |
| `game-read-load-test.js` | `GET /games/*` | List, detail, search, pagination, cache effectiveness |
| `game-write-load-test.js` | `POST/PUT/DELETE /games/*` | Like/unlike, updates, multipart uploads |
| `user-load-test.js` | `/users/*` | Profile, stats, heartbeat, online status |
| `admin-load-test.js` | `/admin/*` | Dashboard analytics, cache management |
| `comprehensive-load-test.js` | All endpoints | Realistic user journeys (70% casual, 20% active, 10% admin) |

### Load Profiles

- **Smoke Test** (10 VUs, 1 min): Quick validation
- **Load Test** (5k-20k VUs, ~25 min): Realistic sustained load with ramp-up
- **Stress Test** (up to 40k VUs, ~20 min): Find breaking points
- **Spike Test** (sudden spikes to 20k VUs): Test resilience

## Installation

### Prerequisites

- k6 installation (on your EC2 test instance)
- Access to your deployed API environment
- Admin and test user credentials

### Install k6 (Ubuntu/Debian)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Setup Test Environment

```bash
# 1. Clone repository to your EC2 instance
git clone <your-repo-url>
cd chareli/Server/k6

# 2. Configure environment
cp env.example .env.k6
nano .env.k6  # Edit with your configuration

# 3. Make scripts executable
chmod +x *.sh
```

## Configuration

Edit `.env.k6` with your settings:

```bash
# Target Environment
BASE_URL=https://api-dev.arcadesbox.com/api

# Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123!

# Test Configuration
TEST_MODE=load              # smoke|load|stress|spike
MIN_VUS=5000
MAX_VUS=20000

# Thresholds
P95_THRESHOLD=1000          # milliseconds
P99_THRESHOLD=2000          # milliseconds
MAX_ERROR_RATE=1            # percentage
```

## Running Tests

### Run Individual Tests

```bash
# Smoke test (quick validation)
TEST_MODE=smoke k6 run tests/auth-load-test.js

# Full load test
TEST_MODE=load k6 run tests/comprehensive-load-test.js

# Stress test
TEST_MODE=stress k6 run tests/comprehensive-load-test.js
```

### Run Complete Test Suite

```bash
# Run all tests with default configuration
./run-all-tests.sh

# Run with specific mode
./run-all-tests.sh --mode load

# Specify output directory
./run-all-tests.sh --mode stress --output-dir ./results/stress-test-$(date +%Y%m%d)
```

### Quick Reference

```bash
# 1. Smoke test (validate setup)
./run-all-tests.sh --mode smoke

# 2. Load test (main test)
./run-all-tests.sh --mode load

# 3. Stress test (find limits)
./run-all-tests.sh --mode stress
```

## EC2 Instance Requirements

### Recommended Instance Types

For running 5,000-20,000 concurrent VUs:

| Instance Type | vCPU | Memory | Network | Best For | Approx. Cost/hr (us-east-1) |
|--------------|------|--------|---------|----------|------------------------------|
| **c5.2xlarge** | 8 | 16 GB | Up to 10 Gbps | 5k-10k VUs | $0.34 (On-Demand), ~$0.10 (Spot) |
| **c5.4xlarge** | 16 | 32 GB | Up to 10 Gbps | 10k-20k VUs | $0.68 (On-Demand), ~$0.20 (Spot) |
| **c5.9xlarge** | 36 | 72 GB | 10 Gbps | 20k+ VUs or complex scripts | $1.53 (On-Demand), ~$0.46 (Spot) |

### Cost Estimate for Full Test Suite

Assuming **c5.4xlarge Spot Instance** (~$0.20/hr):
- Full test suite duration: ~3-4 hours
- **Total cost: $0.60-$0.80** 💰

### Setup on EC2

```bash
# 1. Launch instance with Ubuntu 22.04
# 2. SSH into instance
ssh -i your-key.pem ubuntu@<instance-ip>

# 3. Install k6 (see Installation section)

# 4. Clone repo and configure
git clone <your-repo>
cd chareli/Server/k6
cp env.example .env.k6
# Edit .env.k6 with your settings

# 5. Run tests
./run-all-tests.sh --mode load
```

## Infrastructure Capacity Analysis

### Supabase Nano Limitations

Your current Supabase nano instance has:
- **60 direct database connections** (max)
- **200 connection pooler clients** (max)

### ⚠️ Critical Capacity Concerns

**At 20,000 concurrent users**, even with connection pooling:

1. **Connection Pool Exhaustion**: With 200 pooler clients max, you'll need excellent connection reuse (100 users per connection)
2. **Database Performance**: Nano instances have limited compute resources
3. **Query Throughput**: Heavy analytics queries may timeout
4. **Potential Bottlenecks**:
   - Connection pool saturation → request queuing
   - Database CPU/memory limits → slow queries
   - Shared infrastructure performance variation

### Recommendations

**Before running full 20k load test:**

1. **Start with smoke** test (10 VUs) ✅
2. **Gradually increase**: 100 → 500 → 1000 → 5000 → 10000
3. **Monitor Supabase metrics**:
   - Connection pool usage
   - Query performance
   - CPU/memory utilization
4. **Watch for**:
   - Connection pool exhaustion warnings
   - Increased p95/p99 latencies
   - Error rate spikes

5. **Consider upgrading** to Supabase Pro if:
   - Errors appear above 5k users
   - p95 latency exceeds 2 seconds
   - Connection pool maxes out

### Expected Infrastructure Costs During Testing

**EC2 Instance** (test runner):
- c5.4xlarge Spot: ~$0.60-0.80 total

**Supabase** (nano tier):
- Free tier (no additional cost)
- ⚠️ May hit performance limits

**Data Transfer** (minimal):
- Estimate: < $0.10

**Total Estimated Cost: $0.70-$1.00** 🎯

## Interpreting Results

### Key Metrics

```
http_req_duration........: avg=250ms p95=450ms p99=850ms
http_req_failed..........: 0.5%
iterations...............: 150000
vus_max..................: 20000
```

**What to look for:**

- ✅ **p95 < 1000ms**: Excellent
- ⚠️ **p95 1000-2000ms**: Acceptable, monitor
- ❌ **p95 > 2000ms**: Performance issue

- ✅ **Error rate < 1%**: Excellent
- ⚠️ **Error rate 1-5%**: Investigate
- ❌ **Error rate > 5%**: Critical issue

### Common Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| High error rate at specific VU count | Connection pool exhaustion | Upgrade database tier |
| Increasing p95 latency | Database query performance | Add indexes, optimize queries |
| Random 5xx errors | Application timeouts | Increase timeout settings, scale API |
| Consistent failures on specific endpoint | Code bug or resource limit | Check logs, fix bug |

### Report Files

- **`*-summary.json`**: Machine-readable metrics
- **`*-report.html`**: Visual performance dashboard
- **Console output**: Real-time metrics during test

## Best Practices

### Before Testing

1. ✅ **Test in non-production** environment first
2. ✅ **Alert your team** about the load test
3. ✅ **Monitor infrastructure** (CloudWatch, Supabase dashboard)
4. ✅ **Have rollback plan** if issues arise
5. ✅ **Run smoke test first** to validate setup

### During Testing

1. 📊 **Monitor metrics** in real-time
2. 🔍 **Watch for errors** in application logs
3. 💾 **Check database** connection pool usage
4. 🌐 **Monitor API** response times
5. ⚡ **Be ready to stop** if critical errors occur

### After Testing

1. 📈 **Analyze reports** thoroughly
2. 🐛 **Document issues** found
3. 🔧 **Create action items** for performance improvements
4. 📝 **Update infrastructure** based on learnings
5. 🔄 **Establish baseline** for future tests

## Troubleshooting

### Common Errors

**"Connection refused"**
```bash
# Check BASE_URL in .env.k6
# Ensure API is accessible from EC2 instance
curl https://api-dev.arcadesbox.com/api/games
```

**"Authentication failed"**
```bash
# Verify credentials in .env.k6
# Test login manually:
curl -X POST https://api-dev.arcadesbox.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

**"k6: command not found"**
```bash
# Install k6 (see Installation section)
```

**High error rates immediately**
```bash
# Check if API is rate-limited
# Reduce MIN_VUS and MAX_VUS in .env.k6
# Increase RAMP_UP_DURATION for gradual load
```

## Next Steps

After running tests:

1. **Review results** in `reports/` directory
2. **Identify bottlenecks** from metrics
3. **Optimize code** or infrastructure
4. **Re-test** to validate improvements
5. **Document findings** for team

## Support

- k6 Documentation: https://k6.io/docs/
- Grafana Cloud k6: https://grafana.com/products/cloud/k6/
- GitHub Issues: [Your repo issues page]

---

**Happy Load Testing! 🚀**
