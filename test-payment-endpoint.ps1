# Test the create-payment-intent endpoint
$uri = "https://ambitious-mud-058a66f00.1.azurestaticapps.net/api/create-payment-intent"

$body = @{
    amount = 15000
    currency = "aud"
    customerEmail = "test@example.com"
    customerName = "Test User"
} | ConvertTo-Json

Write-Host "Testing payment endpoint..." -ForegroundColor Cyan
Write-Host "URL: $uri" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Client Secret received: $($response.clientSecret.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "Payment Intent ID: $($response.paymentIntentId)" -ForegroundColor Green
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}
