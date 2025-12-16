#!/bin/bash
# Run all k6 load tests sequentially and generate consolidated reports
# Usage: ./run-all-tests.sh [options]
# Options:
#   --mode <smoke|load|stress|spike>  : Test mode (default: from .env.k6)
#   --output-dir <directory>          : Output directory for reports (default: ./reports)
#   --sequential                      : Run tests one at a time (default)
#   --help                            : Show this help message

set -e

# Default values
MODE=${TEST_MODE:-"load"}
OUTPUT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Run all k6 load tests"
      echo "Usage: ./run-all-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  --mode <smoke|load|stress|spike>  : Test mode (default: load)"
      echo "  --output-dir <directory>           : Output directory for reports (default: ./reports)"
      echo "  --help                             : Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Source environment variables if .env.k6 exists
if [ -f .env.k6 ]; then
  echo "Loading environment from .env.k6..."
  set -a
  source .env.k6
  set +a
else
  echo "Warning: .env.k6 not found. Using default configuration."
  echo "Copy env.example to .env.k6 and configure your environment."
fi

# Override test mode if specified
export TEST_MODE="$MODE"

echo "======================================"
echo "k6 Load Test Suite"
echo "======================================"
echo "Mode: $MODE"
echo "Base URL: ${BASE_URL:-http://localhost:5000/api}"
echo "Output Directory: $OUTPUT_DIR"
echo "Timestamp: $TIMESTAMP"
echo "======================================"
echo ""

# Function to run a test
run_test() {
  local test_name=$1
  local test_file=$2

  echo "----------------------------------------"
  echo "Running: $test_name"
  echo "----------------------------------------"

  k6 run \
    --out json="$OUTPUT_DIR/${test_name}_${TIMESTAMP}.json" \
    "$test_file"

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "✓ $test_name completed successfully"
  else
    echo "✗ $test_name failed with exit code $exit_code"
  fi

  echo ""

  return $exit_code
}

# Track overall success
OVERALL_SUCCESS=0

# Run all tests
echo "Starting test suite execution..."
echo ""

# 1. Authentication Load Test
run_test "auth-load-test" "tests/auth-load-test.js" || OVERALL_SUCCESS=1

# 2. Game Read Load Test
run_test "game-read-load-test" "tests/game-read-load-test.js" || OVERALL_SUCCESS=1

# 3. Game Write Load Test
run_test "game-write-load-test" "tests/game-write-load-test.js" || OVERALL_SUCCESS=1

# 4. User Load Test
run_test "user-load-test" "tests/user-load-test.js" || OVERALL_SUCCESS=1

# 5. Admin Load Test
run_test "admin-load-test" "tests/admin-load-test.js" || OVERALL_SUCCESS=1

# 6. Comprehensive Load Test (combines all)
echo "Running comprehensive test (this may take longer)..."
run_test "comprehensive-load-test" "tests/comprehensive-load-test.js" || OVERALL_SUCCESS=1

echo "======================================"
echo "Test Suite Complete"
echo "======================================"
echo "Reports saved to: $OUTPUT_DIR"
echo ""

# Generate summary
if [ $OVERALL_SUCCESS -eq 0 ]; then
  echo "✓ All tests passed successfully"
else
  echo "✗ Some tests failed. Check individual test reports for details."
fi

echo ""
echo "To view detailed results:"
echo "  - JSON reports: $OUTPUT_DIR/*_${TIMESTAMP}.json"
echo "  - HTML reports: $OUTPUT_DIR/*.html"
echo ""

exit $OVERALL_SUCCESS
