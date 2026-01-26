/**
 * Security Audit Script
 * 
 * Runs security checks including:
 * - npm audit for dependency vulnerabilities
 * - Code pattern checks for common security issues
 * - Environment variable validation
 * 
 * Usage:
 *   node security-audit.js [--strict]
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Warnings found (non-strict mode passes)
 *   2 - Critical issues found (always fails)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STRICT_MODE = process.argv.includes('--strict');
const IS_CI = process.env.CI === 'true';

let warnings = 0;
let criticals = 0;

function log(level, message) {
  const icons = { info: 'ℹ️', warn: '⚠️', error: '❌', pass: '✅' };
  console.log(`${icons[level] || ''} ${message}`);
}

// ============================================================================
// 1. NPM Audit
// ============================================================================

function runNpmAudit() {
  console.log('\n' + '='.repeat(60));
  console.log('1. NPM DEPENDENCY AUDIT');
  console.log('='.repeat(60));

  try {
    const result = execSync('npm audit --json 2>/dev/null || true', { 
      encoding: 'utf-8',
      cwd: __dirname,
    });
    
    const audit = JSON.parse(result || '{}');
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    
    if (vulnerabilities.critical > 0) {
      log('error', `${vulnerabilities.critical} CRITICAL vulnerabilities`);
      criticals += vulnerabilities.critical;
    }
    
    if (vulnerabilities.high > 0) {
      log('error', `${vulnerabilities.high} HIGH vulnerabilities`);
      criticals += vulnerabilities.high;
    }
    
    if (vulnerabilities.moderate > 0) {
      log('warn', `${vulnerabilities.moderate} MODERATE vulnerabilities`);
      warnings += vulnerabilities.moderate;
    }
    
    if (vulnerabilities.low > 0) {
      log('info', `${vulnerabilities.low} LOW vulnerabilities`);
    }
    
    if (criticals === 0 && warnings === 0) {
      log('pass', 'No significant vulnerabilities found');
    }
  } catch (error) {
    log('warn', 'Could not run npm audit');
    warnings++;
  }
}

// ============================================================================
// 2. Code Pattern Security Checks
// ============================================================================

function checkCodePatterns() {
  console.log('\n' + '='.repeat(60));
  console.log('2. CODE PATTERN SECURITY CHECKS');
  console.log('='.repeat(60));

  const patterns = [
    {
      name: 'Hardcoded secrets',
      pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{10,}['"]/gi,
      severity: 'critical',
      exclude: ['.test.', '.spec.', 'setup.ts', 'mock'],
    },
    {
      name: 'SQL injection risk (string concatenation)',
      pattern: /query\s*\(\s*[`'"].*\$\{/gi,
      severity: 'high',
      message: 'Use parameterized queries instead of string interpolation',
    },
    {
      name: 'eval() usage',
      pattern: /\beval\s*\(/gi,
      severity: 'critical',
    },
    {
      name: 'Disabled SSL verification',
      pattern: /rejectUnauthorized\s*:\s*false/gi,
      severity: 'high',
    },
    {
      name: 'Console.log with sensitive data',
      pattern: /console\.(log|info)\s*\([^)]*\b(password|secret|token|key)\b/gi,
      severity: 'medium',
      exclude: ['.test.', '.spec.'],
    },
    {
      name: 'Exposed stack traces',
      pattern: /res\.(json|send)\s*\([^)]*\.stack/gi,
      severity: 'medium',
    },
  ];

  const srcDir = path.join(__dirname, 'src');
  const files = getTypeScriptFiles(srcDir);
  
  let issues = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(__dirname, file);
    
    patterns.forEach(({ name, pattern, severity, exclude, message }) => {
      // Skip excluded files
      if (exclude?.some(ex => relativePath.includes(ex))) {
        return;
      }
      
      const matches = content.match(pattern);
      if (matches) {
        issues.push({ file: relativePath, name, severity, count: matches.length, message });
      }
    });
  });

  // Report issues by severity
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');

  if (criticalIssues.length > 0) {
    criticalIssues.forEach(i => {
      log('error', `CRITICAL: ${i.name} in ${i.file}`);
      if (i.message) console.log(`         ${i.message}`);
    });
    criticals += criticalIssues.length;
  }

  if (highIssues.length > 0) {
    highIssues.forEach(i => {
      log('error', `HIGH: ${i.name} in ${i.file}`);
      if (i.message) console.log(`         ${i.message}`);
    });
    criticals += highIssues.length;
  }

  if (mediumIssues.length > 0) {
    mediumIssues.forEach(i => {
      log('warn', `MEDIUM: ${i.name} in ${i.file}`);
      if (i.message) console.log(`         ${i.message}`);
    });
    warnings += mediumIssues.length;
  }

  if (issues.length === 0) {
    log('pass', 'No security anti-patterns detected');
  }
}

// ============================================================================
// 3. Environment Variable Validation
// ============================================================================

function checkEnvironmentVariables() {
  console.log('\n' + '='.repeat(60));
  console.log('3. ENVIRONMENT VARIABLE CHECKS');
  console.log('='.repeat(60));

  const requiredVars = [
    { name: 'SQL_CONNECTION_STRING', critical: true },
    { name: 'ACS_CONNECTION_STRING', critical: true },
    { name: 'AZURE_OPENAI_KEY', critical: false },
  ];

  const localSettingsPath = path.join(__dirname, 'local.settings.json');
  
  if (fs.existsSync(localSettingsPath)) {
    const settings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf-8'));
    const values = settings.Values || {};
    
    requiredVars.forEach(({ name, critical }) => {
      if (!values[name] || values[name].includes('your-') || values[name] === '') {
        if (critical) {
          log('error', `Missing or placeholder: ${name}`);
          // Don't increment criticals for local dev - just warn
          if (IS_CI) criticals++;
        } else {
          log('warn', `Optional variable not set: ${name}`);
        }
      } else {
        log('pass', `${name} is configured`);
      }
    });
  } else {
    log('warn', 'local.settings.json not found');
    warnings++;
  }

  // Check for secrets in git
  try {
    const gitIgnore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf-8');
    if (!gitIgnore.includes('local.settings.json')) {
      log('error', 'local.settings.json should be in .gitignore');
      criticals++;
    } else {
      log('pass', 'local.settings.json is gitignored');
    }
  } catch {
    log('warn', 'Could not verify .gitignore');
  }
}

// ============================================================================
// 4. HTTPS and CORS Checks
// ============================================================================

function checkSecurityHeaders() {
  console.log('\n' + '='.repeat(60));
  console.log('4. API SECURITY CONFIGURATION');
  console.log('='.repeat(60));

  // Check host.json for CORS config
  const hostPath = path.join(__dirname, 'host.json');
  if (fs.existsSync(hostPath)) {
    const host = JSON.parse(fs.readFileSync(hostPath, 'utf-8'));
    const cors = host.extensions?.http?.cors;
    
    if (cors?.supportCredentials && cors?.allowedOrigins?.includes('*')) {
      log('error', 'CORS allows credentials with wildcard origin');
      criticals++;
    } else if (cors?.allowedOrigins?.includes('*')) {
      log('warn', 'CORS allows all origins (wildcard)');
      warnings++;
    } else {
      log('pass', 'CORS configuration looks reasonable');
    }
  }

  // Check for auth on sensitive endpoints
  const srcDir = path.join(__dirname, 'src', 'functions');
  const files = getTypeScriptFiles(srcDir);
  
  const sensitiveEndpoints = ['admin', 'practitioner', 'clinical-notes', 'session'];
  let authIssues = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(__dirname, file);
    
    // Check if it's a sensitive endpoint
    const isSensitive = sensitiveEndpoints.some(ep => relativePath.includes(ep));
    
    if (isSensitive) {
      // Should have auth checks
      const hasAuth = content.includes('Authorization') || 
                     content.includes('authLevel') ||
                     content.includes('validateToken') ||
                     content.includes('Bearer');
      
      if (!hasAuth) {
        log('warn', `Possibly unauthenticated sensitive endpoint: ${relativePath}`);
        authIssues++;
      }
    }
  });
  
  if (authIssues > 0) {
    warnings += authIssues;
  } else {
    log('pass', 'Sensitive endpoints appear to have auth checks');
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getTypeScriptFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      files.push(...getTypeScriptFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('🔒 SECURITY AUDIT');
  console.log(`   Mode: ${STRICT_MODE ? 'STRICT' : 'STANDARD'}`);
  console.log(`   CI: ${IS_CI}`);

  runNpmAudit();
  checkCodePatterns();
  checkEnvironmentVariables();
  checkSecurityHeaders();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  if (criticals > 0) {
    log('error', `${criticals} critical issues found`);
  }
  if (warnings > 0) {
    log('warn', `${warnings} warnings found`);
  }
  if (criticals === 0 && warnings === 0) {
    log('pass', 'All security checks passed!');
  }

  // Exit code
  if (criticals > 0) {
    process.exit(2);
  }
  if (STRICT_MODE && warnings > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

main();
