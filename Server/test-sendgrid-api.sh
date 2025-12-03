#!/bin/sh

# SendGrid API Diagnostic Test for Alpine/ECS Container
# This script tests SendGrid API connectivity and permissions

set -e

echo "🔍 SendGrid API Diagnostic Test (Alpine/ECS)"
echo "=============================================="
echo ""

# Check if required tools are available
if ! command -v curl >/dev/null 2>&1; then
    echo "❌ curl is not installed. Installing..."
    apk add --no-cache curl
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "📦 jq is not installed. Installing for better JSON parsing..."
    apk add --no-cache jq || echo "⚠️  jq install failed, will use grep instead"
fi

echo "1️⃣ Checking environment variables..."
echo "-----------------------------------"

if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ SENDGRID_API_KEY is not set!"
    echo "   Set it with: export SENDGRID_API_KEY=your_key_here"
    exit 1
else
    # Show first 10 chars of API key
    KEY_PREFIX=$(echo "$SENDGRID_API_KEY" | cut -c1-10)
    echo "✅ API Key: ${KEY_PREFIX}..."
fi

if [ -z "$SENDGRID_FROM_EMAIL" ]; then
    echo "❌ SENDGRID_FROM_EMAIL is not set!"
    echo "   Set it with: export SENDGRID_FROM_EMAIL=your_email@example.com"
    exit 1
else
    echo "✅ From Email: $SENDGRID_FROM_EMAIL"
fi

# Set test recipient (can be overridden)
TO_EMAIL="${TEST_EMAIL:-korantengchristian@gmail.com}"
echo "✅ To Email: $TO_EMAIL"

echo ""
echo "2️⃣ Testing SendGrid API connectivity..."
echo "---------------------------------------"

# Create JSON payload
PAYLOAD=$(cat <<EOF
{
  "personalizations": [
    {
      "to": [{"email": "$TO_EMAIL"}],
      "subject": "SendGrid API Test from ECS Container"
    }
  ],
  "from": {"email": "$SENDGRID_FROM_EMAIL"},
  "content": [
    {
      "type": "text/html",
      "value": "<h1>SendGrid API Test</h1><p>This email was sent from an ECS container using the SendGrid API.</p><p>Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)</p>"
    }
  ]
}
EOF
)

# Make API request
echo "📤 Sending test email..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "3️⃣ Response Analysis..."
echo "----------------------"
echo "HTTP Status Code: $HTTP_CODE"

# Analyze response
case $HTTP_CODE in
    202)
        echo "✅ SUCCESS! Email accepted by SendGrid"
        echo ""
        echo "📧 Email Details:"
        echo "   From: $SENDGRID_FROM_EMAIL"
        echo "   To: $TO_EMAIL"
        echo "   Subject: SendGrid API Test from ECS Container"
        echo ""
        echo "📊 Check SendGrid Activity:"
        echo "   https://app.sendgrid.com/email_activity"
        echo ""
        exit 0
        ;;
    401)
        echo "❌ UNAUTHORIZED (401)"
        echo ""
        echo "🔴 Problem: Invalid or missing API key"
        echo ""
        echo "Solutions:"
        echo "1. Check your API key is correct"
        echo "2. Verify the key hasn't been revoked"
        echo "3. Create a new API key at:"
        echo "   https://app.sendgrid.com/settings/api_keys"
        ;;
    403)
        echo "❌ FORBIDDEN (403)"
        echo ""
        echo "🔴 Problem: API key lacks required permissions"
        echo ""
        echo "Solutions:"
        echo "1. Go to: https://app.sendgrid.com/settings/api_keys"
        echo "2. Find your API key or create a new one"
        echo "3. Ensure 'Mail Send' has 'Full Access' permission"
        echo "4. If sender email is not verified:"
        echo "   - Go to: https://app.sendgrid.com/settings/sender_auth"
        echo "   - Click 'Verify a Single Sender'"
        echo "   - Verify: $SENDGRID_FROM_EMAIL"
        ;;
    400)
        echo "❌ BAD REQUEST (400)"
        echo ""
        echo "🔴 Problem: Invalid request data"
        echo ""
        if command -v jq >/dev/null 2>&1; then
            echo "Error details:"
            echo "$RESPONSE_BODY" | jq '.'
        else
            echo "Response: $RESPONSE_BODY"
        fi
        ;;
    *)
        echo "❌ UNEXPECTED ERROR ($HTTP_CODE)"
        echo ""
        echo "Response:"
        if command -v jq >/dev/null 2>&1; then
            echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
        else
            echo "$RESPONSE_BODY"
        fi
        ;;
esac

echo ""
echo "4️⃣ Additional Diagnostics..."
echo "----------------------------"

# Test DNS resolution
echo "Testing DNS resolution for api.sendgrid.com..."
if nslookup api.sendgrid.com >/dev/null 2>&1 || host api.sendgrid.com >/dev/null 2>&1; then
    echo "✅ DNS resolution successful"
else
    echo "⚠️  DNS resolution may have issues"
fi

# Test network connectivity
echo "Testing network connectivity to SendGrid..."
if curl -s -o /dev/null -w "%{http_code}" https://api.sendgrid.com >/dev/null 2>&1; then
    echo "✅ Network connectivity OK"
else
    echo "❌ Cannot reach SendGrid API (network issue?)"
fi

echo ""
echo "=============================================="
echo "Diagnostic test complete"
echo "=============================================="

exit 1
