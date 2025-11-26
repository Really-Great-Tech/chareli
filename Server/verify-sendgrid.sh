#!/bin/sh
# Verify SendGrid package is installed in container

echo "🔍 Verifying @sendgrid/mail installation..."
echo ""

# Check if package exists in node_modules
if [ -d "/app/node_modules/@sendgrid/mail" ]; then
    echo "✅ @sendgrid/mail directory exists"

    # Check package.json
    if [ -f "/app/node_modules/@sendgrid/mail/package.json" ]; then
        VERSION=$(cat /app/node_modules/@sendgrid/mail/package.json | grep '"version"' | head -1 | cut -d'"' -f4)
        echo "✅ Package version: $VERSION"
    fi

    # Try to require it
    echo ""
    echo "Testing require('@sendgrid/mail')..."
    node -e "const sg = require('@sendgrid/mail'); console.log('✅ Successfully loaded @sendgrid/mail');" 2>&1

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ @sendgrid/mail is properly installed and working!"
        exit 0
    else
        echo ""
        echo "❌ @sendgrid/mail exists but cannot be loaded"
        exit 1
    fi
else
    echo "❌ @sendgrid/mail directory NOT found"
    echo ""
    echo "Checking node_modules contents:"
    ls -la /app/node_modules/@sendgrid/ 2>/dev/null || echo "  No @sendgrid packages found"
    echo ""
    echo "Checking package.json dependencies:"
    grep -A 1 "@sendgrid/mail" /app/package.json || echo "  Not in package.json"
    exit 1
fi
