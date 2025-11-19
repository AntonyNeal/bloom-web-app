# Routing Test Failure Research Plan

## Executive Summary

The prestaging routing tests in this React SPA are consistently failing across all browsers (Chromium, Firefox, WebKit) in the GitHub Actions CI environment. The tests pass locally but fail in CI with content detection timeouts. This research plan provides a systematic approach to diagnose and resolve the issue.

## Problem Statement

### Symptoms

- **Primary Issue**: All 4 routing tests fail across all 3 browsers (12/12 failures)
- **Error Pattern**: `expect(received).toBe(expected) // Object.is equality - Expected: true, Received: false`
- **Root Cause**: `waitForContentWithRetries()` function cannot find any meaningful content on pages
- **Environment**: Failures only occur in GitHub Actions CI, not locally

### Failed Tests

1. `should handle refresh on home page` - All browsers
2. `should handle refresh on about page` - All browsers
3. `should handle refresh on services page` - All browsers
4. `should show version stamp in console` - All browsers

## Technical Context

### Application Architecture

- **Framework**: React 19.1.1 SPA with React Router 7.8.1
- **Build Tool**: Vite 7.1.2
- **Testing**: Playwright 1.55.0
- **A/B Testing**: Custom ABTestProvider with SmartHeader component
- **Deployment**: Azure Static Web Apps

### CI Environment Setup

```yaml
# From .github/workflows/ci-cd-pipeline.yml
- name: Build application for testing
  run: npm run build:ci
- name: Start preview server
  run: npm run preview -- --port 5174 --host 0.0.0.0 &
- name: Wait for server to be ready
  run: timeout 120 bash -c 'until curl -f http://localhost:5174...'
- name: Run Playwright End to End tests
  run: npm run test:prestaging
```

### Test Configuration

```typescript
// playwright.prestaging.config.ts
use: {
  baseURL: process.env.CI ? 'http://localhost:5174' : 'http://localhost:5173',
  trace: 'on-first-retry',
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

## Research Objectives

### Primary Questions to Answer

1. **Server Accessibility**: Is the preview server actually serving content on localhost:5174 in CI?
2. **Build Artifacts**: Are the built files correctly generated and served?
3. **Network Configuration**: Are there network/routing issues in the CI container?
4. **Content Loading**: Is the React app initializing properly in the CI environment?
5. **A/B Testing**: Is the ABTestProvider causing initialization delays?

### Secondary Investigations

1. **Environment Variables**: Are runtime environment variables properly injected?
2. **Asset Loading**: Are CSS/JS assets loading correctly?
3. **Browser Compatibility**: Are there browser-specific issues in the CI environment?
4. **Timing Issues**: Are there race conditions between server startup and test execution?

## Research Methodology

### Phase 1: Server and Network Diagnostics

#### 1.1 Server Accessibility Analysis

**Objective**: Verify the preview server is running and accessible

**Actions Required**:

```bash
# Add to CI pipeline before tests
curl -v http://localhost:5174/
curl -I http://localhost:5174/
wget --spider --server-response http://localhost:5174/ 2>&1
netstat -tlnp | grep :5174
ps aux | grep preview
```

**Expected Outputs**:

- HTTP 200 response with HTML content
- Server process running on port 5174
- Network socket bound correctly

**Failure Analysis**:

- HTTP errors indicate server/deployment issues
- Connection refused suggests port binding problems
- No process suggests server startup failure

#### 1.2 Build Artifact Verification

**Objective**: Ensure built files are correct and complete

**Actions Required**:

```bash
# Add to CI after build step
ls -la dist/
cat dist/index.html | head -50
du -sh dist/*
find dist/ -name "*.js" -o -name "*.css" | head -10
```

**Key Checks**:

- `dist/index.html` exists and contains React app structure
- JavaScript bundles are present and non-empty
- CSS files are generated
- Assets directory exists with required files

### Phase 2: Application Runtime Analysis

#### 2.1 Browser Console Investigation

**Objective**: Capture JavaScript errors and console output

**Test Modifications Needed**:

```typescript
// Add to routing.spec.ts
test('DEBUG: Browser console and network analysis', async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];

  page.on('console', (msg) =>
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
  );
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait and capture state
  await page.waitForTimeout(10000);

  console.log('=== CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg) => console.log(msg));

  console.log('=== ERRORS ===');
  errors.forEach((error) => console.log(error));

  console.log('=== PAGE STATE ===');
  const url = page.url();
  const title = await page.title();
  const bodyHTML = await page.evaluate(() =>
    document.body.innerHTML.substring(0, 500)
  );

  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);
  console.log(`Body: ${bodyHTML}`);
});
```

#### 2.2 React Application State Analysis

**Objective**: Verify React app mounting and A/B test initialization

**Debug Code to Add**:

```typescript
// Add debug logging to src/components/ABTestProvider.tsx
useEffect(() => {
  console.log('[ABTestProvider] Initializing with variant:', variant);
  console.log('[ABTestProvider] Environment:', import.meta.env.MODE);

  // Log timing
  const startTime = performance.now();
  // ... existing initialization logic
  const endTime = performance.now();
  console.log(`[ABTestProvider] Initialization took ${endTime - startTime}ms`);
}, []);
```

```typescript
// Add to src/components/SmartHeader.tsx
console.log('[SmartHeader] Rendering with variant:', variant);
console.log('[SmartHeader] ABTest context available:', !!variant);
```

### Phase 3: Network and Timing Analysis

#### 3.1 Network Request Monitoring

**Objective**: Track all network requests and their status

**Implementation**:

```typescript
test('DEBUG: Network request analysis', async ({ page }) => {
  const requests: string[] = [];
  const responses: string[] = [];

  page.on('request', (request) => {
    requests.push(`${request.method()} ${request.url()}`);
  });

  page.on('response', (response) => {
    responses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/');
  await page.waitForTimeout(15000);

  console.log('=== REQUESTS ===');
  requests.forEach((req) => console.log(req));

  console.log('=== RESPONSES ===');
  responses.forEach((res) => console.log(res));
});
```

#### 3.2 DOM Evolution Tracking

**Objective**: Monitor how the DOM changes over time

**Implementation**:

```typescript
const trackDOMChanges = async (page: Page) => {
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);

    const elementCount = await page.evaluate(
      () => document.querySelectorAll('*').length
    );
    const hasRoot = await page.evaluate(
      () => !!document.getElementById('root')
    );
    const hasReactRoot = await page.evaluate(
      () => !!document.querySelector('[data-reactroot]')
    );
    const bodyText = await page.evaluate(() => document.body.innerText.length);

    console.log(
      `DOM State ${i}s: Elements=${elementCount}, Root=${hasRoot}, ReactRoot=${hasReactRoot}, TextLength=${bodyText}`
    );
  }
};
```

## Debugging Checklist

### Critical Path Verification

- [ ] Preview server starts successfully (`npm run preview`)
- [ ] Server responds to curl on localhost:5174
- [ ] Built index.html contains expected React structure
- [ ] JavaScript bundles load without 404 errors
- [ ] React app mounts (root element populated)
- [ ] ABTestProvider initializes without errors
- [ ] SmartHeader renders appropriate variant

### Environment Comparison

- [ ] Compare local vs CI environment variables
- [ ] Verify build artifacts are identical
- [ ] Check for CI-specific network restrictions
- [ ] Validate browser versions and capabilities

### Timing Analysis

- [ ] Measure server startup time
- [ ] Track React app initialization duration
- [ ] Identify A/B test allocation timing
- [ ] Monitor network request completion

## Expected Findings

### Most Likely Root Causes

1. **Server Startup Race Condition**: Tests start before preview server fully initializes
2. **Build Artifact Issues**: CI build missing critical files or has malformed HTML
3. **Network Configuration**: CI environment blocking localhost connections
4. **A/B Test Initialization**: Delays in variant allocation causing content delays

### Resolution Strategies

1. **Add Robust Server Health Checks**: Verify server returns valid HTML before starting tests
2. **Implement Progressive Content Detection**: Start with basic DOM presence, progress to specific content
3. **Add Comprehensive Logging**: Capture all network, console, and DOM state information
4. **Increase Timeouts**: Allow more time for CI environment initialization

## Implementation Priority

### Immediate Actions (High Priority)

1. Add the DEBUG test cases to capture detailed CI environment state
2. Implement server health checks in CI pipeline
3. Add comprehensive logging to A/B testing components
4. Verify build artifacts and preview server functionality

### Secondary Actions (Medium Priority)

1. Compare local vs CI environment configurations
2. Implement progressive timeout strategies
3. Add network request monitoring
4. Create fallback content detection methods

### Long-term Improvements (Low Priority)

1. Optimize A/B testing initialization performance
2. Add CI environment-specific configurations
3. Implement retry mechanisms for flaky tests
4. Create comprehensive test environment validation

## Success Criteria

### Research Complete When

- [ ] Root cause of content detection failure identified
- [ ] Server accessibility confirmed or issues documented
- [ ] React app initialization timing understood
- [ ] A/B testing impact on content loading measured
- [ ] Actionable fix strategy developed

### Test Success Metrics

- [ ] All routing tests pass consistently in CI
- [ ] Content detection works within reasonable timeouts
- [ ] No false positive failures due to environment issues
- [ ] Tests provide meaningful feedback on actual routing problems

---

**Research Duration Estimate**: 4-6 hours
**Required Expertise**: CI/CD pipelines, Playwright testing, React SPA architecture, Azure deployment
**Tools Needed**: GitHub Actions access, Playwright trace viewer, Browser developer tools
