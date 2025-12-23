#!/bin/bash

set -euo pipefail

echo "=== JSON CDN Verification Script ==="
echo ""

# Test 1: File Accessibility
echo "1. Testing file accessibility..."
echo "   Categories: $(curl -s -o /dev/null -w "%{http_code}" https://dev.cdn.arcadesbox.org/cdn/categories.json) (expect 200)"
echo "   Active games: $(curl -s -o /dev/null -w "%{http_code}" https://dev.cdn.arcadesbox.org/cdn/games_active.json) (expect 200)"
echo "   All games: $(curl -s -o /dev/null -w "%{http_code}" https://dev.cdn.arcadesbox.org/cdn/games_all.json) (expect 200)"
echo "   Game detail: $(curl -s -o /dev/null -w "%{http_code}" https://dev.cdn.arcadesbox.org/cdn/games/galactic-war.json) (expect 200)"
echo ""

# Test 2: CORS headers (with Origin)
echo "2. Testing CORS headers (with Origin header)..."
CORS_HEADERS=$(curl -sI -H "Origin: https://dev.arcadesbox.com" https://dev.cdn.arcadesbox.org/cdn/categories.json | grep -i "access-control" || echo "   ❌ No CORS headers")
if [[ "$CORS_HEADERS" == *"access-control-allow-origin"* ]]; then
    echo "   ✅ CORS configured correctly"
    echo "$CORS_HEADERS" | sed 's/^/   /'
else
    echo "$CORS_HEADERS"
fi
echo ""

# Test 3: Cache headers
echo "3. Testing cache headers..."
CACHE_HEADER=$(curl -sI https://dev.cdn.arcadesbox.org/cdn/categories.json | grep -i "cache-control:" || echo "   ❌ No cache headers")
if [[ "$CACHE_HEADER" == *"max-age=300"* ]]; then
    echo "   ✅ Cache headers configured correctly"
    echo "   $CACHE_HEADER"
else
    echo "$CACHE_HEADER"
fi
echo ""

# Test 4: Content validation
echo "4. Testing content structure..."
METADATA=$(curl -s https://dev.cdn.arcadesbox.org/cdn/categories.json | jq -r '.metadata | "Generated: \(.generatedAt) | Count: \(.count)"' 2>/dev/null || echo "   ❌ Invalid JSON")
if [[ "$METADATA" == *"Generated:"* ]]; then
    echo "   ✅ JSON structure valid"
    echo "   $METADATA"
else
    echo "   ❌ JSON parsing failed"
fi
echo ""

# Test 5: Response time
echo "5. Testing CDN performance..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://dev.cdn.arcadesbox.org/cdn/categories.json)
echo "   Response time: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
    echo "   ✅ Fast response (<500ms)"
else
    echo "   ⚠️  Slower than expected"
fi
echo ""

echo "=== Verification Complete ==="
