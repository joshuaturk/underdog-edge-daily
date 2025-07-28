#!/bin/bash

# BTTS Scheduler Setup Script
# This script sets up the nightly CRON job for BTTS picks updates

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏈 BTTS Picks Scheduler Setup${NC}"
echo "==============================="

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Required environment variables not set${NC}"
    echo "Please set SUPABASE_URL and SUPABASE_ANON_KEY"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Supabase URL: $SUPABASE_URL"
echo "Schedule: Daily at 00:30 UTC"
echo "Function: btts-scheduler"
echo ""

# Test the Edge Function first
echo -e "${YELLOW}🧪 Testing BTTS Scheduler Function...${NC}"
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/btts-scheduler" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Edge Function test successful${NC}"
else
    echo -e "${RED}❌ Edge Function test failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Create SQL for CRON job setup (to be run in Supabase SQL editor)
echo -e "${YELLOW}📝 Generating CRON job SQL...${NC}"

cat > btts-cron-setup.sql << EOF
-- Enable required extensions for CRON jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the CRON job for BTTS picks (daily at 00:30 UTC)
SELECT cron.schedule(
  'btts-daily-update',
  '30 0 * * *',  -- Every day at 00:30 UTC
  \$\$
  SELECT
    net.http_post(
        url:='${SUPABASE_URL}/functions/v1/btts-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${SUPABASE_ANON_KEY}"}'::jsonb,
        body:='{"scheduled": true, "time": "' || now() || '"}'::jsonb
    ) as request_id;
  \$\$
);

-- Verify the CRON job was created
SELECT * FROM cron.job WHERE jobname = 'btts-daily-update';
EOF

echo -e "${GREEN}✅ CRON setup SQL generated: btts-cron-setup.sql${NC}"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Open your Supabase SQL Editor"
echo "2. Run the SQL commands from btts-cron-setup.sql"
echo "3. Verify the CRON job is scheduled correctly"
echo "4. Check Edge Function logs for scheduled executions"
echo ""

echo -e "${YELLOW}🔍 Manual Testing:${NC}"
echo "You can manually trigger the scheduler with:"
echo "curl -X POST $SUPABASE_URL/functions/v1/btts-scheduler \\"
echo "  -H \"Authorization: Bearer $SUPABASE_ANON_KEY\""
echo ""

echo -e "${YELLOW}📊 Monitoring:${NC}"
echo "• Check btts_picks table for new picks daily"
echo "• Monitor btts_analysis table for update metadata"
echo "• Review Edge Function logs in Supabase dashboard"
echo ""

echo -e "${GREEN}🎯 BTTS Picks Scheduler setup complete!${NC}"
echo "The system will now generate picks nightly at 00:30 UTC"