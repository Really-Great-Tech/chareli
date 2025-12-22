#!/bin/bash

# k6 Load Test Comparison Script
# Compares cold start vs hot start performance
# Usage: ./analyze-cold-vs-hot.sh <cold-log> <hot-log> [env]

set -euo pipefail

# -------------------------------
# Colors
# -------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# -------------------------------
# Arguments
# -------------------------------
if [ "$#" -lt 2 ]; then
    echo -e "${RED}Usage: $0 <cold-start-log> <hot-start-log> [env] [infra-desc]${NC}"
    exit 1
fi

COLD_LOG="$1"
HOT_LOG="$2"
TEST_ENV="${3:-dev}"
INFRA_DESC="${4:-ECS 1 min 20 max + Redis cache.t4g.micro + Supabase micro compute CPU 2-core ARM (Shared) Memory 1 GB}"

# -------------------------------
# Validation
# -------------------------------
for f in "$COLD_LOG" "$HOT_LOG"; do
    if [ ! -f "$f" ]; then
        echo -e "${RED}Error: File not found: $f${NC}"
        exit 1
    fi
done

mkdir -p logs

# -------------------------------
# Header
# -------------------------------
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}k6 Load Test Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Cold Start Log: ${YELLOW}$COLD_LOG${NC}"
echo -e "Hot Start Log:  ${YELLOW}$HOT_LOG${NC}"
echo -e "Environment:   ${YELLOW}$TEST_ENV${NC}"
echo ""

OUTPUT="logs/comparison-report-$(date +%Y%m%d-%H%M%S).md"

# -------------------------------
# Functions
# -------------------------------
extract_metrics() {
    local log_file=$1
    local title=$2

    {
        echo "## $title"
        echo ""
        grep -A 50 "TOTAL RESULTS" "$log_file" \
            | grep -E "(checks_|http_req_|iterations|vus)" \
            || echo "Metrics not found"
        echo ""
    } >> "$OUTPUT"
}

extract_errors() {
    local log_file=$1

    local dial
    local req

    dial=$(grep -c "dial: i/o timeout" "$log_file" 2>/dev/null || true)
    req=$(grep -c "request timeout" "$log_file" 2>/dev/null || true)

    echo "$dial|$req|$((dial + req))"
}

extract_checks() {
    local log_file=$1

    grep -A 20 "TOTAL RESULTS" "$log_file" \
        | grep "✓\|✗" \
        | grep -v "THRESHOLDS" \
        || echo "No checks found"
}

get_percent() {
    local log_file=$1
    local metric=$2

    grep -A 3 "$metric" "$log_file" \
        | grep -oP '\d+(\.\d+)?%' \
        | head -1 \
        || echo "N/A"
}

get_integer() {
    local log_file=$1
    local metric=$2

    grep "$metric" "$log_file" \
        | grep -oP '(?<=:\s)\d+' \
        | head -1 \
        || echo "N/A"
}

float_gt() {
    awk "BEGIN {exit !($1 > $2)}"
}

get_response_time() {
    local log_file=$1
    local type=$2

    grep "http_req_duration" "$log_file" \
        | grep "{type:$type}" \
        | grep "p(95)" \
        | grep -oP '(?<=p\(95\)=)[0-9.]+[a-z]+' \
        | head -1 \
        || echo "N/A"
}

# -------------------------------
# Report Header
# -------------------------------
cat > "$OUTPUT" << EOF
# k6 Load Test Comparison Report
**Cold Start vs Hot Start Performance Analysis**

---

## Test Configuration

| Parameter | Value |
|-----------|-------|
| Virtual Users | 2000 |
| Duration | 5 minutes |
| Environment | $TEST_ENV |
| Infrastructure | $INFRA_DESC |

---

### Cold Start
- Log: \`$(basename "$COLD_LOG")\`
- Initial Capacity: Minimum
- Autoscaling: Enabled

### Hot Start
- Log: \`$(basename "$HOT_LOG")\`
- Initial Capacity: Pre-scaled
- Autoscaling: N/A

---
EOF

# -------------------------------
# Metrics
# -------------------------------
extract_metrics "$COLD_LOG" "Cold Start Results"
extract_metrics "$HOT_LOG" "Hot Start Results"

# -------------------------------
# Errors
# -------------------------------
echo "## Error Analysis" >> "$OUTPUT"
echo "" >> "$OUTPUT"

COLD_ERR=$(extract_errors "$COLD_LOG")
HOT_ERR=$(extract_errors "$HOT_LOG")

IFS='|' read -r cold_dial cold_req cold_total <<< "$COLD_ERR"
IFS='|' read -r hot_dial hot_req hot_total <<< "$HOT_ERR"

cat >> "$OUTPUT" << EOF
| Error Type | Cold | Hot | Delta |
|-----------|------|-----|-------|
| Dial Timeouts | $cold_dial | $hot_dial | $((cold_dial - hot_dial)) |
| Request Timeouts | $cold_req | $hot_req | $((cold_req - hot_req)) |
| **Total Errors** | **$cold_total** | **$hot_total** | **$((cold_total - hot_total))** |

---
EOF

# -------------------------------
# Check Details
# -------------------------------
echo "## Cold Start – Detailed Checks" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
extract_checks "$COLD_LOG" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "## Hot Start – Detailed Checks" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
extract_checks "$HOT_LOG" >> "$OUTPUT"
echo '```' >> "$OUTPUT"
echo "" >> "$OUTPUT"

# -------------------------------
# Performance Comparison
# -------------------------------
COLD_SUCCESS=$(get_percent "$COLD_LOG" "checks_succeeded")
HOT_SUCCESS=$(get_percent "$HOT_LOG" "checks_succeeded")
COLD_FAIL=$(get_percent "$COLD_LOG" "checks_failed")
HOT_FAIL=$(get_percent "$HOT_LOG" "checks_failed")
COLD_ITER=$(get_integer "$COLD_LOG" "iterations")
HOT_ITER=$(get_integer "$HOT_LOG" "iterations")

winner_success="N/A"
if [[ "$COLD_SUCCESS" != "N/A" && "$HOT_SUCCESS" != "N/A" ]]; then
    if float_gt "${HOT_SUCCESS%\%}" "${COLD_SUCCESS%\%}"; then
        winner_success="🏆 Hot"
    else
        winner_success="🏆 Cold"
    fi
fi

winner_iter="N/A"
if [[ "$COLD_ITER" != "N/A" && "$HOT_ITER" != "N/A" ]]; then
    if (( HOT_ITER > COLD_ITER )); then
        winner_iter="🏆 Hot"
    else
        winner_iter="🏆 Cold"
    fi
fi

# Extract p95 response times
COLD_P95_ANALYTICS=$(get_response_time "$COLD_LOG" "analytics")
HOT_P95_ANALYTICS=$(get_response_time "$HOT_LOG" "analytics")
COLD_P95_GAME=$(get_response_time "$COLD_LOG" "game_launch")
HOT_P95_GAME=$(get_response_time "$HOT_LOG" "game_launch")

cat >> "$OUTPUT" << EOF
## Performance Comparison

| Metric | Cold | Hot | Winner |
|-------|------|-----|--------|
| Success Rate | $COLD_SUCCESS | $HOT_SUCCESS | $winner_success |
| Failure Rate | $COLD_FAIL | $HOT_FAIL | — |
| Iterations | $COLD_ITER | $HOT_ITER | $winner_iter |
| Analytics p95 | $COLD_P95_ANALYTICS | $HOT_P95_ANALYTICS | — |
| Game Launch p95 | $COLD_P95_GAME | $HOT_P95_GAME | — |

---
EOF

echo "Report generated at: $(date)" >> "$OUTPUT"

# -------------------------------
# Summary
# -------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Analysis Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Report saved to: ${YELLOW}$OUTPUT${NC}"
echo ""
echo -e "${BLUE}Quick Summary:${NC}"
echo -e "  Cold Success: ${GREEN}$COLD_SUCCESS${NC}"
echo -e "  Hot Success:  ${GREEN}$HOT_SUCCESS${NC}"
echo ""
echo -e "${YELLOW}View full report:${NC} cat $OUTPUT"
echo ""
