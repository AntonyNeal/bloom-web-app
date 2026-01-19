# Azure OpenAI Model Configuration

## Current Deployments

| Model | Deployment Name | Status | TPM | Best For |
|-------|----------------|--------|-----|----------|
| **GPT-4.1** | `gpt-4-1` | ✅ Active (default) | 50K | General clinical notes - latest flagship model |
| **GPT-4o** | `gpt-4o` | ✅ Active | 50K | Fast responses, good for real-time features |
| **o1** | `o1` | ⏳ Pending quota | - | Complex clinical reasoning (when approved) |

## Resource Details

- **Resource Name:** `lpa-openai`
- **Resource Group:** `lpa-rg`
- **Region:** Australia East
- **Endpoint:** `https://australiaeast.api.cognitive.microsoft.com/`

## Switching Models

### Option 1: Environment Variable (Recommended)

Change the `AZURE_OPENAI_DEPLOYMENT` environment variable:

**Local Development** - Edit `api/local.settings.json`:
```json
"AZURE_OPENAI_DEPLOYMENT": "gpt-4-1"   // or "gpt-4o" or "o1"
```

**Production** - Update Azure Function App settings:
```bash
az functionapp config appsettings set \
  --name <your-function-app-name> \
  --resource-group lpa-rg \
  --settings AZURE_OPENAI_DEPLOYMENT=gpt-4-1
```

### Option 2: Code Default

Edit `api/src/functions/clinical-notes-llm.ts`:
```typescript
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4-1';
```

## Deploying o1 (When Quota Approved)

Once your o1 quota request is approved, deploy the model:

```bash
az cognitiveservices account deployment create \
  --name lpa-openai \
  --resource-group lpa-rg \
  --deployment-name o1 \
  --model-name o1 \
  --model-version 2024-12-17 \
  --model-format OpenAI \
  --sku-capacity 5 \
  --sku-name GlobalStandard
```

Then update your environment variable:
```bash
# Local
"AZURE_OPENAI_DEPLOYMENT": "o1"

# Production
az functionapp config appsettings set \
  --name <your-function-app-name> \
  --resource-group lpa-rg \
  --settings AZURE_OPENAI_DEPLOYMENT=o1
```

## Model Comparison for Clinical Notes

| Feature | GPT-4.1 | GPT-4o | o1 |
|---------|---------|--------|-----|
| **Speed** | Fast | Fastest | Slower (reasoning) |
| **Accuracy** | Excellent | Very Good | Best |
| **Cost** | $$ | $ | $$$ |
| **Best For** | General clinical notes | Quick summaries | Complex clinical reasoning |
| **Context Window** | 128K | 128K | 200K |

### Recommendation

- **Start with GPT-4.1** - Best balance of quality, speed, and cost
- **Use o1 for complex cases** - When clinical reasoning accuracy is critical
- **GPT-4o for prep summaries** - Fast pre-session briefs

## Checking Current Deployments

```bash
az cognitiveservices account deployment list \
  --name lpa-openai \
  --resource-group lpa-rg \
  --output table
```

## Checking Quota Usage

```bash
az cognitiveservices usage list \
  --location australiaeast \
  --output table
```

## Troubleshooting

### "Model not found" Error
Ensure the deployment name matches exactly:
```bash
az cognitiveservices account deployment list --name lpa-openai --resource-group lpa-rg -o table
```

### "Quota exceeded" Error
Check your current quota:
```bash
az cognitiveservices usage list --location australiaeast -o json
```

Request more quota at: https://aka.ms/oai/stuquotarequest

### API Version Compatibility
Current API version: `2024-08-01-preview`

For o1 models, ensure you're using a compatible API version that supports reasoning models.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | `https://australiaeast.api.cognitive.microsoft.com/` |
| `AZURE_OPENAI_KEY` | API key for authentication | `e2f40d4e...` |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name | `gpt-4-1`, `gpt-4o`, `o1` |

## Cost Estimates

Pricing is per 1M tokens (as of Jan 2026):

| Model | Input | Output |
|-------|-------|--------|
| GPT-4.1 | $2.00 | $8.00 |
| GPT-4o | $2.50 | $10.00 |
| o1 | $15.00 | $60.00 |

**Typical session note generation:**
- ~2,000 input tokens (transcription)
- ~1,000 output tokens (clinical note)
- Cost per note: ~$0.01 (GPT-4.1) to ~$0.09 (o1)
