#!/bin/bash

# Redis Caching Test Script
# Tests all implemented caching functionality

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
USER_TOKEN="${USER_TOKEN:-}"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# Check if Redis is running
check_redis() {
    print_header "Checking Redis Connection"
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_fail "Redis is not running. Please start Redis first."
        exit 1
    fi
}

# Test cache stats endpoint
test_cache_stats() {
    print_header "Testing Cache Stats Endpoint"
    print_test "GET /admin/cache/stats"

    if [ -z "$ADMIN_TOKEN" ]; then
        print_fail "ADMIN_TOKEN not set. Skipping admin tests."
        return
    fi

    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/admin/cache/stats")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        print_success "Cache stats endpoint returned 200"
        echo "$body" | jq '.'

        # Check if response has expected fields
        if echo "$body" | jq -e '.data.enabled' > /dev/null; then
            print_success "Response contains 'enabled' field"
        else
            print_fail "Response missing 'enabled' field"
        fi
    else
        print_fail "Cache stats endpoint returned $http_code"
        echo "$body"
    fi
}

# Test game detail caching
test_game_detail_cache() {
    print_header "Testing Game Detail Caching"

    # Get first game ID
    print_test "Getting first game ID"
    games_response=$(curl -s "$API_URL/games?limit=1")
    game_id=$(echo "$games_response" | jq -r '.data[0].id')

    if [ -z "$game_id" ] || [ "$game_id" = "null" ]; then
        print_fail "Could not get game ID"
        return
    fi

    print_info "Using game ID: $game_id"

    # First request (cache miss)
    print_test "First request (cache miss)"
    start_time=$(date +%s%N)
    response1=$(curl -s "$API_URL/games/$game_id")
    end_time=$(date +%s%N)
    time1=$((($end_time - $start_time) / 1000000))

    if echo "$response1" | jq -e '.success' > /dev/null; then
        print_success "First request successful (${time1}ms)"
    else
        print_fail "First request failed"
        return
    fi

    # Second request (cache hit)
    print_test "Second request (cache hit)"
    start_time=$(date +%s%N)
    response2=$(curl -s "$API_URL/games/$game_id")
    end_time=$(date +%s%N)
    time2=$((($end_time - $start_time) / 1000000))

    if echo "$response2" | jq -e '.success' > /dev/null; then
        print_success "Second request successful (${time2}ms)"

        # Check if second request was faster
        if [ $time2 -lt $time1 ]; then
            speedup=$((time1 - time2))
            print_success "Cache hit was ${speedup}ms faster (${time1}ms → ${time2}ms)"
        else
            print_info "Second request: ${time2}ms (first: ${time1}ms)"
        fi
    else
        print_fail "Second request failed"
    fi
}

# Test games list caching
test_games_list_cache() {
    print_header "Testing Games List Caching"

    # First request (cache miss)
    print_test "First request (cache miss)"
    start_time=$(date +%s%N)
    response1=$(curl -s "$API_URL/games?limit=10")
    end_time=$(date +%s%N)
    time1=$((($end_time - $start_time) / 1000000))

    if echo "$response1" | jq -e '.data' > /dev/null; then
        print_success "First request successful (${time1}ms)"
    else
        print_fail "First request failed"
        return
    fi

    # Second request (cache hit)
    print_test "Second request (cache hit)"
    start_time=$(date +%s%N)
    response2=$(curl -s "$API_URL/games?limit=10")
    end_time=$(date +%s%N)
    time2=$((($end_time - $start_time) / 1000000))

    if echo "$response2" | jq -e '.data' > /dev/null; then
        print_success "Second request successful (${time2}ms)"

        if [ $time2 -lt $time1 ]; then
            speedup=$((time1 - time2))
            print_success "Cache hit was ${speedup}ms faster"
        fi
    else
        print_fail "Second request failed"
    fi
}

# Test special filters caching
test_special_filters() {
    print_header "Testing Special Filters Caching"

    # Test recently_added filter
    print_test "Testing recently_added filter"
    start_time=$(date +%s%N)
    response1=$(curl -s "$API_URL/games?filter=recently_added")
    end_time=$(date +%s%N)
    time1=$((($end_time - $start_time) / 1000000))

    if echo "$response1" | jq -e '.data' > /dev/null; then
        print_success "Recently added filter works (${time1}ms)"
    else
        print_fail "Recently added filter failed"
    fi

    # Second request (should be cached)
    start_time=$(date +%s%N)
    response2=$(curl -s "$API_URL/games?filter=recently_added")
    end_time=$(date +%s%N)
    time2=$((($end_time - $start_time) / 1000000))

    if [ $time2 -lt $time1 ]; then
        print_success "Recently added filter cached (${time1}ms → ${time2}ms)"
    else
        print_info "Recently added second request: ${time2}ms"
    fi

    # Test popular filter
    print_test "Testing popular filter"
    response=$(curl -s "$API_URL/games?filter=popular")

    if echo "$response" | jq -e '.data' > /dev/null; then
        print_success "Popular filter works"
    else
        print_fail "Popular filter failed"
    fi
}

# Test analytics caching
test_analytics_cache() {
    print_header "Testing Analytics Caching"

    if [ -z "$ADMIN_TOKEN" ]; then
        print_fail "ADMIN_TOKEN not set. Skipping analytics tests."
        return
    fi

    print_test "First analytics request (cache miss)"
    start_time=$(date +%s%N)
    response1=$(curl -s \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/analytics?limit=10")
    end_time=$(date +%s%N)
    time1=$((($end_time - $start_time) / 1000000))

    if echo "$response1" | jq -e '.data' > /dev/null; then
        print_success "First analytics request successful (${time1}ms)"
    else
        print_fail "First analytics request failed"
        return
    fi

    print_test "Second analytics request (cache hit)"
    start_time=$(date +%s%N)
    response2=$(curl -s \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/analytics?limit=10")
    end_time=$(date +%s%N)
    time2=$((($end_time - $start_time) / 1000000))

    if echo "$response2" | jq -e '.data' > /dev/null; then
        print_success "Second analytics request successful (${time2}ms)"

        if [ $time2 -lt $time1 ]; then
            speedup=$((time1 - time2))
            print_success "Analytics cache hit was ${speedup}ms faster"
        fi
    else
        print_fail "Second analytics request failed"
    fi
}

# Test cache invalidation
test_cache_invalidation() {
    print_header "Testing Cache Invalidation"

    if [ -z "$ADMIN_TOKEN" ]; then
        print_fail "ADMIN_TOKEN not set. Skipping invalidation tests."
        return
    fi

    print_test "Clearing games cache"
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/admin/cache/clear/games")

    if echo "$response" | jq -e '.success' > /dev/null; then
        print_success "Games cache cleared successfully"
    else
        print_fail "Failed to clear games cache"
    fi

    print_test "Clearing categories cache"
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/admin/cache/clear/categories")

    if echo "$response" | jq -e '.success' > /dev/null; then
        print_success "Categories cache cleared successfully"
    else
        print_fail "Failed to clear categories cache"
    fi
}

# Test rate limiting
test_rate_limiting() {
    print_header "Testing Redis-Backed Rate Limiting"

    print_test "Making multiple rapid requests"
    success_count=0
    rate_limited=false

    for i in {1..65}; do
        response=$(curl -s -w "\n%{http_code}" "$API_URL/games?limit=1")
        http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" = "200" ]; then
            ((success_count++))
        elif [ "$http_code" = "429" ]; then
            rate_limited=true
            break
        fi
    done

    if [ "$rate_limited" = true ]; then
        print_success "Rate limiting is working (limited after $success_count requests)"
    else
        print_info "Made $success_count requests without hitting rate limit"
    fi
}

# Test cache compression
test_cache_compression() {
    print_header "Testing Cache Compression"

    print_test "Checking Redis memory usage"

    # Get cache stats
    if [ -z "$ADMIN_TOKEN" ]; then
        print_info "ADMIN_TOKEN not set. Skipping compression test."
        return
    fi

    response=$(curl -s \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_URL/admin/cache/stats")

    memory_used=$(echo "$response" | jq -r '.data.memoryUsed')
    keys=$(echo "$response" | jq -r '.data.keys')

    if [ -n "$memory_used" ] && [ "$memory_used" != "null" ]; then
        print_success "Memory usage: $memory_used for $keys keys"
    else
        print_info "Could not retrieve memory usage stats"
    fi
}

# Print summary
print_summary() {
    print_header "Test Summary"

    total_tests=$((TESTS_PASSED + TESTS_FAILED))

    echo -e "Total Tests: $total_tests"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
        exit 0
    else
        echo -e "\n${RED}Some tests failed! ✗${NC}\n"
        exit 1
    fi
}

# Main execution
main() {
    print_header "Redis Caching Test Suite"

    echo "API URL: $API_URL"
    echo "Admin Token: ${ADMIN_TOKEN:+***set***}"
    echo "User Token: ${USER_TOKEN:+***set***}"
    echo ""

    # Run tests
    check_redis
    test_cache_stats
    test_game_detail_cache
    test_games_list_cache
    test_special_filters
    test_analytics_cache
    test_cache_invalidation
    test_rate_limiting
    test_cache_compression

    # Print summary
    print_summary
}

# Run main
main
