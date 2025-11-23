# Life Psychology Australia - Performance Monitoring Dashboard

## Overview

This document contains KQL queries and monitoring configurations for comprehensive performance monitoring of Life Psychology Australia website using Azure Application Insights and Log Analytics.

## Application Insights Resource

- **Resource Name**: ait42kldozqahcu
- **Resource Group**: rg-lpa-prod-opt
- **Instrumentation Key**: 31c09786-0875-4ffe-a140-912a8cf2b29c
- **Connection String**: InstrumentationKey=31c09786-0875-4ffe-a140-912a8cf2b29c;IngestionEndpoint=https://australiaeast-1.in.applicationinsights.azure.com/;LiveEndpoint=https://australiaeast.livediagnostics.monitor.azure.com/;ApplicationId=34e18f34-f6ac-4614-b26a-17ae1dc7c539

## Core Performance Metrics

### 1. Core Web Vitals Dashboard

```kql
// Largest Contentful Paint (LCP) - Good < 2.5s, Needs Improvement 2.5-4s, Poor > 4s
customMetrics
| where name == "CoreWebVitals.LCP"
| where timestamp >= ago(7d)
| summarize
    avg_lcp = avg(value),
    p50_lcp = percentile(value, 50),
    p75_lcp = percentile(value, 75),
    p90_lcp = percentile(value, 90),
    p95_lcp = percentile(value, 95),
    good_count = countif(value <= 2500),
    needs_improvement_count = countif(value > 2500 and value <= 4000),
    poor_count = countif(value > 4000),
    total_count = count()
    by bin(timestamp, 1h)
| extend
    good_percentage = round((good_count * 100.0 / total_count), 2),
    needs_improvement_percentage = round((needs_improvement_count * 100.0 / total_count), 2),
    poor_percentage = round((poor_count * 100.0 / total_count), 2)
| order by timestamp desc

// First Input Delay (FID) - Good < 100ms, Needs Improvement 100-300ms, Poor > 300ms
customMetrics
| where name == "CoreWebVitals.FID"
| where timestamp >= ago(7d)
| summarize
    avg_fid = avg(value),
    p90_fid = percentile(value, 90),
    p95_fid = percentile(value, 95),
    good_count = countif(value <= 100),
    needs_improvement_count = countif(value > 100 and value <= 300),
    poor_count = countif(value > 300),
    total_count = count()
    by bin(timestamp, 1h)
| extend
    good_percentage = round((good_count * 100.0 / total_count), 2),
    needs_improvement_percentage = round((needs_improvement_count * 100.0 / total_count), 2),
    poor_percentage = round((poor_count * 100.0 / total_count), 2)

// Cumulative Layout Shift (CLS) - Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
customMetrics
| where name == "CoreWebVitals.CLS"
| where timestamp >= ago(7d)
| summarize
    avg_cls = avg(value),
    p75_cls = percentile(value, 75),
    good_count = countif(value <= 0.1),
    needs_improvement_count = countif(value > 0.1 and value <= 0.25),
    poor_count = countif(value > 0.25),
    total_count = count()
    by bin(timestamp, 1h)
```

### 2. Page Performance Metrics

```kql
// Page Load Times by Page
pageViews
| where timestamp >= ago(24h)
| extend page = tostring(customDimensions.path)
| summarize
    page_views = count(),
    avg_duration = avg(duration),
    p50_duration = percentile(duration, 50),
    p90_duration = percentile(duration, 90),
    p95_duration = percentile(duration, 95)
    by page
| order by page_views desc

// Browser Performance Analysis
browserTimings
| where timestamp >= ago(24h)
| summarize
    avg_page_load = avg(totalDuration),
    avg_dom_processing = avg(processingDuration),
    avg_network = avg(networkDuration),
    sample_count = count()
    by client_Browser, client_OS
| order by sample_count desc
```

### 3. User Behavior & Conversion Tracking

```kql
// Booking Funnel Analysis
customEvents
| where timestamp >= ago(7d)
| where name startswith "Booking."
| summarize event_count = count() by name, bin(timestamp, 1d)
| order by timestamp desc

// Assessment Flow Analysis
customEvents
| where timestamp >= ago(7d)
| where name startswith "Assessment."
| summarize event_count = count() by name, bin(timestamp, 1d)

// Chat Interaction Analysis
customEvents
| where timestamp >= ago(7d)
| where name startswith "Chat."
| summarize event_count = count() by name, bin(timestamp, 1d)

// Popular Pages Analysis
pageViews
| where timestamp >= ago(7d)
| extend page = tostring(customDimensions.path)
| summarize
    page_views = count(),
    unique_users = dcount(user_Id),
    avg_session_duration = avg(duration)
    by page
| order by page_views desc
| take 20
```

### 4. Error Monitoring & Reliability

```kql
// JavaScript Errors
exceptions
| where timestamp >= ago(24h)
| where client_Type == "Browser"
| summarize
    error_count = count(),
    unique_users_affected = dcount(user_Id),
    sample_message = any(outerMessage)
    by problemId, type
| order by error_count desc

// Failed Requests
requests
| where timestamp >= ago(24h)
| where success == false
| summarize
    failed_requests = count(),
    avg_duration = avg(duration),
    result_codes = make_set(resultCode)
    by name
| order by failed_requests desc
```

### 5. Performance Trends & Alerts

```kql
// Performance Degradation Detection
customMetrics
| where name in ("Performance.DOMContentLoaded", "Performance.LoadComplete")
| where timestamp >= ago(7d)
| summarize avg_value = avg(value) by name, bin(timestamp, 1h)
| order by timestamp desc

// User Experience Score
let lcp_threshold = 2500;  // Good LCP threshold
let fid_threshold = 100;   // Good FID threshold
let cls_threshold = 0.1;   // Good CLS threshold
customMetrics
| where name in ("CoreWebVitals.LCP", "CoreWebVitals.FID", "CoreWebVitals.CLS")
| where timestamp >= ago(24h)
| summarize
    lcp_good = countif(name == "CoreWebVitals.LCP" and value <= lcp_threshold),
    lcp_total = countif(name == "CoreWebVitals.LCP"),
    fid_good = countif(name == "CoreWebVitals.FID" and value <= fid_threshold),
    fid_total = countif(name == "CoreWebVitals.FID"),
    cls_good = countif(name == "CoreWebVitals.CLS" and value <= cls_threshold),
    cls_total = countif(name == "CoreWebVitals.CLS")
| extend
    lcp_score = round((lcp_good * 100.0 / lcp_total), 1),
    fid_score = round((fid_good * 100.0 / fid_total), 1),
    cls_score = round((cls_good * 100.0 / cls_total), 1),
    overall_score = round(((lcp_good + fid_good + cls_good) * 100.0 / (lcp_total + fid_total + cls_total)), 1)
```

## Recommended Alerts

### 1. Performance Alerts

```kql
// Alert when average LCP > 4 seconds (poor)
customMetrics
| where name == "CoreWebVitals.LCP"
| where timestamp >= ago(15m)
| summarize avg_lcp = avg(value)
| where avg_lcp > 4000

// Alert when error rate > 5%
exceptions
| where timestamp >= ago(15m)
| summarize
    total_page_views = count(),
    error_count = count()
| extend error_rate = (error_count * 100.0 / total_page_views)
| where error_rate > 5
```

### 2. Business Metrics Alerts

```kql
// Alert when booking completion rate drops below 80%
let booking_started = customEvents | where timestamp >= ago(1h) and name == "Booking.booking_started" | count;
let booking_completed = customEvents | where timestamp >= ago(1h) and name == "Booking.booking_completed" | count;
print completion_rate = (booking_completed * 100.0 / booking_started)
| where completion_rate < 80
```

## Dashboard Configuration

### Workbook Structure

1. **Overview Tab**: Key metrics summary, user experience score
2. **Performance Tab**: Core Web Vitals, page load times, browser performance
3. **User Behavior Tab**: Popular pages, conversion funnels, user flows
4. **Reliability Tab**: Error monitoring, failed requests, availability
5. **Business Metrics Tab**: Booking conversions, assessment completions, chat usage

### Visualization Types

- **Time Series Charts**: Performance trends over time
- **Pie Charts**: Browser/OS distribution, Core Web Vitals scoring
- **Bar Charts**: Popular pages, error frequency
- **Tables**: Detailed breakdowns, top errors
- **Scorecards**: Key performance indicators

### Refresh Intervals

- **Real-time metrics**: 1 minute refresh
- **Performance trends**: 5 minute refresh
- **Business metrics**: 15 minute refresh
- **Historical analysis**: Manual refresh

## Implementation Steps

1. **Create Application Insights Workbook** in Azure Portal
2. **Import KQL Queries** from this document
3. **Configure Visualizations** according to dashboard structure
4. **Set Up Alerts** for critical performance and business metrics
5. **Share Dashboard** with stakeholders
6. **Regular Review** and optimization of queries

## Integration with Front Door

Once Front Door configuration is unlocked:

- Add Front Door metrics to dashboard
- Monitor cache hit ratios
- Track edge location performance
- Analyze traffic distribution

## Monitoring Goals

- **Performance**: Maintain 90%+ good Core Web Vitals scores
- **Reliability**: Keep error rate below 1%
- **User Experience**: Page load times under 2 seconds
- **Business Impact**: Monitor booking conversion rates
- **Operational Excellence**: Proactive issue detection and resolution
