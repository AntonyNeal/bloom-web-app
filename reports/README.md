# 📊 Reports Directory

This directory contains generated reports and audits that are excluded from version control but preserved locally for reference.

## 📁 Structure

```
reports/
├── lighthouse/          # Lighthouse performance audit reports
│   ├── *.json           # Raw JSON reports
│   └── *.html           # Human-readable HTML reports
└── performance/         # Performance optimization documentation
```

## 🔄 Regenerating Reports

### Lighthouse Audits

```bash
# Run Lighthouse audit on production
npx lighthouse https://bloom.life-psychology.com.au --output=json --output=html --output-path=./reports/lighthouse/audit-$(date +%Y%m%d)

# Run on local development
npx lighthouse http://localhost:5173 --output=json --output=html --output-path=./reports/lighthouse/local-audit
```

## ⚠️ Note

These files are `.gitignore`d. To share a report with the team:
1. Upload to shared drive
2. Reference in a GitHub issue
3. Include summary in PR description
