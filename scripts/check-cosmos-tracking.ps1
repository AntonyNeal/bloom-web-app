#!/usr/bin/env pwsh
# Check Cosmos DB tracking data

Write-Host "🔍 Checking Cosmos DB Tracking..." -ForegroundColor Cyan
Write-Host ""

# Get Cosmos DB credentials
$accountName = "cdbt42kldozqahcu"
$resourceGroup = "rg-lpa-prod-opt"
$databaseName = "conversion-analytics"
$containerName = "user-sessions"

Write-Host "📊 Cosmos DB Configuration:" -ForegroundColor Yellow
Write-Host "  Account: $accountName"
Write-Host "  Database: $databaseName"
Write-Host "  Container: $containerName"
Write-Host ""

# Get connection details
try {
    $endpoint = az cosmosdb show --name $accountName --resource-group $resourceGroup --query documentEndpoint -o tsv
    $key = az cosmosdb keys list --name $accountName --resource-group $resourceGroup --query primaryMasterKey -o tsv
    
    Write-Host "✅ Successfully retrieved connection details" -ForegroundColor Green
    Write-Host "  Endpoint: $endpoint"
    Write-Host ""
    
    # Query for recent tracking events using Azure CLI
    Write-Host "📈 Querying recent tracking events..." -ForegroundColor Yellow
    
    $query = "SELECT TOP 10 c.type, c.userId, c.testName, c.variant, c.timestamp FROM c ORDER BY c.timestamp DESC"
    
    $result = az cosmosdb sql query `
        --account-name $accountName `
        --resource-group $resourceGroup `
        --database-name $databaseName `
        --container-name $containerName `
        --query-text $query `
        2>$null
    
    if ($LASTEXITCODE -eq 0) {
        $data = $result | ConvertFrom-Json
        
        if ($data.Count -gt 0) {
            Write-Host "✅ Found $($data.Count) tracking events:" -ForegroundColor Green
            $data | Format-Table -AutoSize
        } else {
            Write-Host "⚠️  No tracking events found in database" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "This could mean:" -ForegroundColor Cyan
            Write-Host "  1. Tracking hasn't been triggered yet (visit the website)"
            Write-Host "  2. Azure Functions environment variables not configured"
            Write-Host "  3. Frontend tracking not calling backend APIs"
        }
    } else {
        Write-Host "❌ Failed to query Cosmos DB" -ForegroundColor Red
    }
    
    # Check for conversion events specifically
    Write-Host ""
    Write-Host "🎯 Checking for conversion events..." -ForegroundColor Yellow
    
    $conversionQuery = "SELECT COUNT(1) as count FROM c WHERE c.type = 'conversion-event'"
    
    $convResult = az cosmosdb sql query `
        --account-name $accountName `
        --resource-group $resourceGroup `
        --database-name $databaseName `
        --container-name $containerName `
        --query-text $conversionQuery `
        2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $convResult) {
        $count = $convResult[0].count
        Write-Host "  Conversion events: $count" -ForegroundColor $(if ($count -gt 0) { 'Green' } else { 'Yellow' })
    }
    
    # Check for variant allocations
    $allocationQuery = "SELECT COUNT(1) as count FROM c WHERE c.type = 'variant-allocation'"
    
    $allocResult = az cosmosdb sql query `
        --account-name $accountName `
        --resource-group $resourceGroup `
        --database-name $databaseName `
        --container-name $containerName `
        --query-text $allocationQuery `
        2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $allocResult) {
        $count = $allocResult[0].count
        Write-Host "  Variant allocations: $count" -ForegroundColor $(if ($count -gt 0) { 'Green' } else { 'Yellow' })
    }
    
    Write-Host ""
    Write-Host "💡 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Check Azure Function environment variables (COSMOS_DB_CONNECTION_STRING)"
    Write-Host "  2. Verify frontend is calling Azure Function endpoints"
    Write-Host "  3. Check Application Insights logs for errors"
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
