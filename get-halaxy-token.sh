#!/bin/bash
# Get Halaxy credentials from Azure Container App and fetch bearer token

FULL_ENV="staging"

# Map environment name
case "$FULL_ENV" in
  production) ENV_SHORT="prod" ;;
  staging) ENV_SHORT="staging" ;;
  *) ENV_SHORT="dev" ;;
esac

APP_NAME="lpa-halaxy-sync-${ENV_SHORT}"
RG_NAME="rg-lpa-unified"

echo "🔍 Fetching Halaxy credentials from Container App..."

# Get environment variables from container app
CLIENT_ID=$(az containerapp show --name $APP_NAME --resource-group $RG_NAME --query "properties.template.containers[0].env[?name=='HALAXY_CLIENT_ID'].value" -o tsv 2>/dev/null)
CLIENT_SECRET=$(az containerapp show --name $APP_NAME --resource-group $RG_NAME --query "properties.template.containers[0].env[?name=='HALAXY_CLIENT_SECRET'].value" -o tsv 2>/dev/null)

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "❌ Could not fetch Halaxy credentials from Container App"
  echo "   Check that the app is deployed and credentials are configured"
  exit 1
fi

echo "✅ Credentials fetched"
echo "   Client ID: ${CLIENT_ID:0:20}..."

# Get bearer token
echo ""
echo "🔑 Requesting bearer token from Halaxy..."

RESPONSE=$(curl -s -X POST "https://au-api.halaxy.com/oauth2/token" \
  -H "Content-Type: application/json" \
  -H "Accept: application/fhir+json" \
  -H "User-Agent: Life-Psychology-Australia (support@life-psychology.com.au)" \
  -d "{
    \"grant_type\": \"client_credentials\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$CLIENT_SECRET\"
  }")

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
EXPIRES_IN=$(echo $RESPONSE | jq -r '.expires_in')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get bearer token"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo "✅ Bearer Token obtained:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$ACCESS_TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  Expires In: $EXPIRES_IN seconds (~$((EXPIRES_IN / 60)) minutes)"
echo ""
echo "🔧 Usage: Add this header to your API requests:"
echo "   Authorization: Bearer $ACCESS_TOKEN"
