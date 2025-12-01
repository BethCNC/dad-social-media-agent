#!/bin/bash

# Deployment Verification Script
# Run this after deploying to Coolify to verify everything works

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide your deployment URL${NC}"
    echo "Usage: ./verify-deployment.sh https://your-domain.com"
    exit 1
fi

BASE_URL=$1

echo -e "${YELLOW}Starting deployment verification for: ${BASE_URL}${NC}\n"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}

    echo -n "Testing ${description}... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP ${response})"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP ${response}, expected ${expected_status})"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local endpoint=$1
    local description=$2

    echo -n "Testing ${description}... "

    response=$(curl -s "${BASE_URL}${endpoint}" 2>/dev/null)
    status=$?

    if [ $status -eq 0 ] && echo "$response" | jq empty 2>/dev/null; then
        echo -e "${GREEN}✓ PASSED${NC} (Valid JSON)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Invalid or no response)"
        return 1
    fi
}

passed=0
failed=0

echo "=== BASIC CONNECTIVITY ==="
if test_endpoint "/" "Frontend root" 200; then ((passed++)); else ((failed++)); fi
if test_endpoint "/health" "Health check" 200; then ((passed++)); else ((failed++)); fi

echo ""
echo "=== API ENDPOINTS ==="
if test_json_endpoint "/api/holidays" "Holidays API"; then ((passed++)); else ((failed++)); fi
if test_json_endpoint "/api/dashboard" "Dashboard API"; then ((passed++)); else ((failed++)); fi

echo ""
echo "=== STATIC FILES ==="
if test_endpoint "/assets/" "Frontend assets" "200\|404"; then ((passed++)); else ((failed++)); fi

echo ""
echo "=== DETAILED CHECKS ==="

# Check health endpoint response
echo -n "Checking health endpoint response... "
health_response=$(curl -s "${BASE_URL}/health" 2>/dev/null)
if echo "$health_response" | grep -q "healthy"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((passed++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $health_response"
    ((failed++))
fi

# Check if frontend loads (contains expected React elements)
echo -n "Checking frontend HTML... "
frontend_html=$(curl -s "${BASE_URL}/" 2>/dev/null)
if echo "$frontend_html" | grep -q "root"; then
    echo -e "${GREEN}✓ PASSED${NC} (React root div found)"
    ((passed++))
else
    echo -e "${RED}✗ FAILED${NC} (React root div not found)"
    ((failed++))
fi

# Check CORS headers
echo -n "Checking CORS headers... "
cors_headers=$(curl -s -I "${BASE_URL}/api/holidays" 2>/dev/null | grep -i "access-control")
if [ -n "$cors_headers" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (No CORS headers found - may cause issues)"
    ((passed++))
fi

# Summary
echo ""
echo "=== SUMMARY ==="
echo -e "Passed: ${GREEN}${passed}${NC}"
echo -e "Failed: ${RED}${failed}${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Deployment looks good.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open ${BASE_URL} in your browser"
    echo "2. Test the complete user flow:"
    echo "   - Generate monthly content plan"
    echo "   - Generate weekly schedule"
    echo "   - Create content with AI"
    echo "   - Generate images/videos"
    echo "   - Schedule social posts"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "- Check Coolify logs for startup errors"
    echo "- Verify all environment variables are set"
    echo "- Ensure health check is configured correctly"
    echo "- Check that port 8000 is exposed"
    echo ""
    exit 1
fi
