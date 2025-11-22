# 🌸 Bloom Web App - Future Development Roadmap

**Document Version:** 1.0
**Created:** November 22, 2025
**Project:** Bloom Application Management System
**Owner:** Life Psychology Australia

---

## 📋 Executive Summary

This document outlines suggested future development opportunities for the Bloom Web Application. All items are presented as **recommendations** rather than prescriptions, allowing the development team to prioritize based on business needs, resource availability, and user feedback.

The roadmap is organized into **themes** (Epics in Jira), with each theme containing multiple **user stories** that can be tracked as individual tickets on a Kanban board.

---

## 🎯 How to Use This Document for Jira

### Creating Your Kanban Board

1. **Create Epics** for each major theme (e.g., "Security & Authentication", "Testing Infrastructure")
2. **Create Stories** for each ticket listed under themes
3. **Use Story Points** provided for estimation (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21)
4. **Apply Labels** for cross-cutting concerns (performance, accessibility, security)
5. **Set Priorities** based on business value and technical dependencies

### Ticket Template

Each ticket in this document includes:

- **Title**: Concise story name
- **Story**: User story format (As a... I want... So that...)
- **Acceptance Criteria**: Definition of done
- **Story Points**: Effort estimation
- **Priority**: Suggested priority (P0=Critical, P1=High, P2=Medium, P3=Low)
- **Dependencies**: Prerequisites or blockers
- **Technical Notes**: Implementation guidance
- **Labels**: Category tags

---

## 🏗️ Development Themes (Epics)

### Epic 1: Security & Authentication Enhancement

### Epic 2: Testing Infrastructure & Quality Assurance

### Epic 3: Performance Optimization

### Epic 4: User Experience & Accessibility

### Epic 5: API & Backend Improvements

### Epic 6: Admin Portal Features

### Epic 7: Monitoring & Analytics

### Epic 8: Email & Notifications

### Epic 9: Documentation & Developer Experience

### Epic 10: Database & Data Management

---

## 🔐 EPIC 1: Security & Authentication Enhancement

**Epic Description**: Enhance security measures across the application to protect user data and prevent unauthorized access.

**Business Value**: Reduces security risks, ensures compliance, builds trust with practitioners.

### Tickets

#### BLOOM-101: Implement API Rate Limiting

**Story**: As a system administrator, I want API endpoints to have rate limiting so that we prevent abuse and DDoS attacks.

**Acceptance Criteria**:

- [ ] Rate limiting middleware implemented on Azure Functions
- [ ] Configurable limits per endpoint (e.g., 100 requests/minute)
- [ ] Proper HTTP 429 responses with Retry-After headers
- [ ] Different limits for authenticated vs anonymous users
- [ ] Rate limit counters stored in Redis or Azure Cache
- [ ] Admin dashboard shows rate limit violations

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Consider Azure API Management for enterprise-grade rate limiting
- Implement sliding window algorithm
- Use IP address + user ID for tracking
- Log rate limit violations for security monitoring

**Labels**: security, backend, api

---

#### BLOOM-102: Add Email Verification for Applicants

**Story**: As a security team member, I want applicants to verify their email addresses so that we confirm identity and prevent spam submissions.

**Acceptance Criteria**:

- [ ] Email verification token generated on application submission
- [ ] Verification email sent with secure link (expires in 24 hours)
- [ ] Application marked as "email_verified" in database
- [ ] Admin portal shows verification status
- [ ] Resend verification email functionality
- [ ] Email templates branded with Bloom design system

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-301 (Email infrastructure)

**Technical Notes**:

- Use JWT for verification tokens
- Consider Azure Communication Services or SendGrid
- Store token hash in database, not plain token
- Implement token rotation for security

**Labels**: security, backend, email, database

---

#### BLOOM-103: Implement Role-Based Access Control (RBAC)

**Story**: As an admin, I want different access levels for team members so that we can control who can approve, reject, or view applications.

**Acceptance Criteria**:

- [ ] Define roles: SuperAdmin, Admin, Reviewer, Viewer
- [ ] Add user_role column to database
- [ ] Middleware checks role before allowing actions
- [ ] UI hides/shows features based on role
- [ ] SuperAdmin can manage user roles
- [ ] Audit log tracks role changes
- [ ] API endpoints enforce role permissions

**Story Points**: 13

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-104 (Audit logging)

**Technical Notes**:

- Integrate with Azure AD groups for role mapping
- Use claims-based authorization
- Consider implementing permissions (finer-grained than roles)
- Cache role checks for performance

**Labels**: security, backend, frontend, authentication

---

#### BLOOM-104: Implement Comprehensive Audit Logging

**Story**: As a compliance officer, I want all critical actions logged so that we can track changes and investigate security incidents.

**Acceptance Criteria**:

- [ ] Log all status changes to applications
- [ ] Log all file uploads and downloads
- [ ] Log authentication events (login, logout, failed attempts)
- [ ] Log admin actions (role changes, data exports)
- [ ] Logs include: timestamp, user ID, action, IP address, result
- [ ] Logs stored in Azure Application Insights or dedicated table
- [ ] Admin dashboard shows recent audit logs
- [ ] Logs retained for 90 days minimum

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use structured logging (JSON format)
- Consider Azure Application Insights for centralized logging
- Implement log correlation IDs for request tracing
- Add GDPR-compliant PII handling in logs

**Labels**: security, backend, compliance, monitoring

---

#### BLOOM-105: Add IP Allowlisting for Admin Portal

**Story**: As a security administrator, I want to restrict admin portal access to specific IP addresses so that we reduce the attack surface.

**Acceptance Criteria**:

- [ ] Configuration for allowed IP ranges (CIDR notation)
- [ ] IP check on all admin routes
- [ ] Graceful error message for blocked IPs
- [ ] Admin can temporarily allowlist IPs (for remote work)
- [ ] IP allowlist changes logged in audit log
- [ ] Supports both IPv4 and IPv6

**Story Points**: 5

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Implement at Azure Front Door or Application Gateway level
- Consider office VPN IP ranges
- Allow emergency bypass mechanism
- Test with common corporate proxy setups

**Labels**: security, infrastructure, backend

---

#### BLOOM-106: Implement File Upload Security Scanning

**Story**: As a security team member, I want uploaded files scanned for malware so that we protect our systems and admin users.

**Acceptance Criteria**:

- [ ] All uploaded files scanned before storage
- [ ] Virus/malware detection implemented
- [ ] Malicious files rejected with clear error message
- [ ] Admin notified of blocked malicious uploads
- [ ] Quarantine mechanism for suspicious files
- [ ] Scanning logs stored for audit

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use Azure Defender for Storage or third-party API (VirusTotal, ClamAV)
- Scan files asynchronously to avoid blocking uploads
- Consider file size limits for scanning
- Implement retry logic for scanner API failures

**Labels**: security, backend, storage

---

## 🧪 EPIC 2: Testing Infrastructure & Quality Assurance

**Epic Description**: Establish comprehensive testing practices to ensure code quality, catch bugs early, and enable confident deployments.

**Business Value**: Reduces production bugs, improves code quality, enables faster feature development.

### Tickets

#### BLOOM-201: Set Up Unit Testing Framework

**Story**: As a developer, I want a unit testing framework so that I can test individual functions and components in isolation.

**Acceptance Criteria**:

- [ ] Vitest or Jest configured for React components
- [ ] Test utilities installed (React Testing Library, @testing-library/jest-dom)
- [ ] Sample tests written for 3-5 components
- [ ] Test coverage reporting configured (aim for 60%+ coverage)
- [ ] CI pipeline runs tests on every PR
- [ ] Tests run in watch mode during development
- [ ] Documentation on writing tests added to README

**Story Points**: 8

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Prefer Vitest for Vite projects (faster, better integration)
- Mock Azure Functions API calls
- Use MSW (Mock Service Worker) for API mocking
- Test accessibility with jest-axe

**Labels**: testing, frontend, ci-cd

---

#### BLOOM-202: Implement Integration Tests for API

**Story**: As a QA engineer, I want integration tests for API endpoints so that we verify the full request-response cycle works correctly.

**Acceptance Criteria**:

- [ ] Integration test framework set up (Supertest or similar)
- [ ] Tests for all /api/applications endpoints (GET, POST, PUT)
- [ ] Tests for /api/upload endpoint
- [ ] Database seeding for consistent test data
- [ ] Test cleanup after each run
- [ ] Integration tests run in CI pipeline
- [ ] Mock external services (Azure Storage, SendGrid)

**Story Points**: 13

**Priority**: P1 (High)

**Dependencies**: BLOOM-201

**Technical Notes**:

- Use in-memory SQL database for tests (better-sqlite3)
- Consider test containers for realistic database testing
- Separate test and development databases
- Test both success and error scenarios

**Labels**: testing, backend, api, ci-cd

---

#### BLOOM-203: Add End-to-End Tests with Playwright

**Story**: As a QA engineer, I want E2E tests so that we verify critical user flows work from start to finish.

**Acceptance Criteria**:

- [ ] Playwright installed and configured
- [ ] E2E test for application submission flow (full form fill + submit)
- [ ] E2E test for admin login and application review
- [ ] E2E test for file upload functionality
- [ ] Tests run in headless mode in CI
- [ ] Screenshots/videos captured on test failure
- [ ] Tests run against staging environment before production deployment

**Story Points**: 13

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-201, BLOOM-202

**Technical Notes**:

- Use Playwright for cross-browser testing (Chrome, Firefox, Safari)
- Mock external services to avoid real charges
- Use page object model for maintainability
- Run tests in parallel for speed

**Labels**: testing, frontend, backend, ci-cd

---

#### BLOOM-204: Implement Visual Regression Testing

**Story**: As a designer, I want visual regression tests so that we catch unintended UI changes before they reach production.

**Acceptance Criteria**:

- [ ] Visual regression tool configured (Percy, Chromatic, or Playwright screenshots)
- [ ] Baseline screenshots captured for key pages (Landing, JoinUs form, Admin dashboard)
- [ ] Visual diffs generated on PR builds
- [ ] Approval workflow for intentional visual changes
- [ ] Mobile and desktop viewports tested
- [ ] Integration with CI pipeline

**Story Points**: 8

**Priority**: P3 (Low)

**Dependencies**: BLOOM-203

**Technical Notes**:

- Consider Percy or Chromatic for cloud-based visual testing
- Playwright has built-in screenshot comparison
- Test responsive breakpoints: mobile (375px), tablet (768px), desktop (1920px)
- Exclude dynamic content (timestamps, random data)

**Labels**: testing, frontend, ui-ux

---

#### BLOOM-205: Add Accessibility Automated Testing

**Story**: As an accessibility advocate, I want automated a11y tests so that we catch accessibility issues early in development.

**Acceptance Criteria**:

- [ ] axe-core or similar tool integrated
- [ ] A11y tests run on all pages in CI
- [ ] Tests check: keyboard navigation, ARIA labels, color contrast, heading structure
- [ ] A11y violations fail the build (or warn, depending on severity)
- [ ] Reports generated showing violations
- [ ] Documentation on fixing common a11y issues

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-201

**Technical Notes**:

- Use @axe-core/react for React components
- Integrate jest-axe for unit tests
- Use Playwright's accessibility assertions for E2E tests
- Consider pa11y for automated scanning

**Labels**: testing, accessibility, frontend

---

#### BLOOM-206: Create Load Testing Suite

**Story**: As a performance engineer, I want load tests so that we understand system capacity and identify bottlenecks.

**Acceptance Criteria**:

- [ ] Load testing tool set up (k6, Artillery, or Azure Load Testing)
- [ ] Scenarios for common user flows (submit application, admin reviews)
- [ ] Tests simulate 100, 500, 1000 concurrent users
- [ ] Response time and error rate metrics collected
- [ ] Database connection pool limits tested
- [ ] Results documented with recommendations

**Story Points**: 8

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use k6 for scripting load tests
- Test Azure Functions scale-out behavior
- Monitor database DTU usage during tests
- Test blob storage throughput limits

**Labels**: testing, performance, backend

---

## ⚡ EPIC 3: Performance Optimization

**Epic Description**: Improve application performance to reduce load times, enhance user experience, and reduce infrastructure costs.

**Business Value**: Better user experience, lower bounce rates, reduced Azure costs.

### Tickets

#### BLOOM-301: Implement Frontend Code Splitting

**Story**: As a user, I want faster page loads so that I can access the application quickly.

**Acceptance Criteria**:

- [ ] Route-based code splitting implemented for all pages
- [ ] Lazy loading for non-critical components (modals, heavy forms)
- [ ] Bundle size reduced by 30%+ for initial load
- [ ] Preload critical chunks for faster navigation
- [ ] Bundle analysis reports generated on build
- [ ] Lighthouse Performance score improves to 95+

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Already partially implemented (QualificationCheck is lazy loaded)
- Use React.lazy() and Suspense
- Configure Vite's manual chunks for optimal splitting
- Preload next likely page (e.g., preload JoinUs when on homepage)

**Labels**: performance, frontend

---

#### BLOOM-302: Optimize Database Queries

**Story**: As a system administrator, I want optimized database queries so that API responses are faster and we use fewer database resources.

**Acceptance Criteria**:

- [ ] Slow query analysis completed (> 100ms queries identified)
- [ ] Missing indexes added to frequently queried columns
- [ ] N+1 query problems resolved
- [ ] Query execution plans reviewed
- [ ] Pagination implemented for large result sets
- [ ] Database connection pooling optimized
- [ ] Average query time reduced by 40%

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Add indexes on: email, status, created_at, ahpra_registration
- Use `EXPLAIN` to analyze query plans
- Consider database views for complex queries
- Implement query result caching (Redis)

**Labels**: performance, backend, database

---

#### BLOOM-303: Implement API Response Caching

**Story**: As a developer, I want API response caching so that we reduce database load and improve response times.

**Acceptance Criteria**:

- [ ] Redis or Azure Cache for Redis configured
- [ ] GET /api/applications responses cached (5-minute TTL)
- [ ] Cache invalidation on data updates (POST, PUT)
- [ ] Cache hit rate monitoring in place
- [ ] Cache warming for frequently accessed data
- [ ] Graceful fallback if cache is unavailable

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use Azure Cache for Redis (managed service)
- Implement cache-aside pattern
- Set appropriate TTLs based on data staleness tolerance
- Consider ETag headers for client-side caching

**Labels**: performance, backend, infrastructure

---

#### BLOOM-304: Optimize Image Delivery

**Story**: As a user, I want images to load quickly so that I have a better browsing experience.

**Acceptance Criteria**:

- [ ] Images served in modern formats (WebP, AVIF with fallbacks)
- [ ] Responsive images for different screen sizes
- [ ] Lazy loading for below-the-fold images
- [ ] CDN configured for static assets
- [ ] Image compression implemented (85-90% quality)
- [ ] Core Web Vitals (LCP) improved by 20%

**Story Points**: 5

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use Azure CDN for static asset delivery
- Implement `<picture>` element with srcset
- Consider Azure Image Optimization service
- Compress images during build with sharp or imagemin

**Labels**: performance, frontend, infrastructure

---

#### BLOOM-305: Implement Service Worker for Offline Support

**Story**: As a practitioner, I want the application to work offline so that I can fill out forms without constant internet connection.

**Acceptance Criteria**:

- [ ] Service worker registered and activated
- [ ] Static assets cached for offline access
- [ ] Form data saved to IndexedDB while offline
- [ ] Background sync submits forms when online
- [ ] User notified of online/offline status
- [ ] Works on mobile devices (iOS, Android)

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use Workbox for service worker management
- Cache application shell for instant loads
- Implement cache-first strategy for static assets
- Network-first for API calls with fallback to cache

**Labels**: performance, frontend, pwa

---

## 👥 EPIC 4: User Experience & Accessibility

**Epic Description**: Enhance user experience and ensure accessibility for all users, including those with disabilities.

**Business Value**: Better user satisfaction, WCAG compliance, wider audience reach.

### Tickets

#### BLOOM-401: Implement Form Auto-Save

**Story**: As an applicant, I want my form progress automatically saved so that I don't lose my work if I accidentally close the browser.

**Acceptance Criteria**:

- [ ] Form data saved to localStorage every 30 seconds
- [ ] Restore form data on page reload
- [ ] Clear saved data after successful submission
- [ ] User notification: "Draft saved" indicator
- [ ] Works across all form steps
- [ ] Expired drafts cleaned up after 7 days

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use localStorage for persistence
- Debounce save operations to avoid excessive writes
- Encrypt sensitive data before storing
- Handle multi-tab scenarios (last write wins)

**Labels**: frontend, ux, forms

---

#### BLOOM-402: Add Multi-Step Form Progress Indicator

**Story**: As an applicant, I want a clear progress indicator so that I know how many steps remain in the application process.

**Acceptance Criteria**:

- [ ] Visual progress bar showing current step (e.g., "Step 2 of 5")
- [ ] Step names displayed (Personal Info, Qualifications, etc.)
- [ ] Completed steps visually distinguished
- [ ] Mobile-friendly design
- [ ] Accessible to screen readers
- [ ] Click previous steps to navigate back

**Story Points**: 3

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use stepper component from shadcn/ui or build custom
- Implement with semantic HTML (`<nav>`, `<ol>`)
- ARIA attributes: aria-current, aria-label
- Persist current step in URL query params for shareable links

**Labels**: frontend, ux, accessibility, forms

---

#### BLOOM-403: Implement Keyboard Shortcuts for Admin Portal

**Story**: As an admin power user, I want keyboard shortcuts so that I can navigate and take actions more efficiently.

**Acceptance Criteria**:

- [ ] Shortcuts for common actions: Approve (A), Reject (R), Next (→), Previous (←)
- [ ] Search focus shortcut (Cmd/Ctrl + K)
- [ ] Help modal showing shortcuts (? key)
- [ ] Shortcuts work across all admin pages
- [ ] Visual indicators for shortcut-enabled buttons
- [ ] Accessible announcements for shortcut actions

**Story Points**: 5

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use react-hotkeys-hook or implement custom
- Prevent conflicts with browser shortcuts
- Allow customization of shortcuts (future enhancement)
- Test on Windows (Ctrl) and Mac (Cmd) keyboards

**Labels**: frontend, ux, admin, accessibility

---

#### BLOOM-404: Add Dark Mode Support

**Story**: As a user, I want dark mode so that I can reduce eye strain during late-night work.

**Acceptance Criteria**:

- [ ] Dark mode color palette defined (maintains brand identity)
- [ ] Toggle switch in header for light/dark/auto modes
- [ ] Preference saved in localStorage
- [ ] Respects system preference (prefers-color-scheme)
- [ ] Smooth transition between modes
- [ ] All pages and components support dark mode
- [ ] WCAG contrast ratios maintained in dark mode

**Story Points**: 8

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use CSS custom properties for theming
- Tailwind dark mode utilities (class strategy)
- Test color contrast for accessibility
- Consider user preference persistence across devices (requires backend)

**Labels**: frontend, ux, accessibility, design

---

#### BLOOM-405: Implement Comprehensive Form Validation with Better Error Messages

**Story**: As an applicant, I want clear error messages so that I understand exactly what needs to be corrected.

**Acceptance Criteria**:

- [ ] Inline validation on blur for all fields
- [ ] Real-time validation for email, phone, AHPRA number
- [ ] Error messages are specific and actionable (not generic)
- [ ] Visual indicators for error fields (red border, icon)
- [ ] Error summary at top of form for accessibility
- [ ] Validation messages announced to screen readers
- [ ] Success indicators for valid fields

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use React Hook Form for validation
- Zod schema for validation rules
- Implement ARIA live regions for error announcements
- Consider showing character count for textarea fields

**Labels**: frontend, ux, forms, accessibility

---

#### BLOOM-406: Add Tooltip Help System

**Story**: As an applicant, I want helpful tooltips so that I understand what information is needed for each field.

**Acceptance Criteria**:

- [ ] Tooltips added to complex fields (AHPRA number format, qualifications)
- [ ] Info icon (ℹ️) triggers tooltip on hover/click
- [ ] Mobile-friendly (tap to show, tap outside to dismiss)
- [ ] Accessible to keyboard users (focus triggers tooltip)
- [ ] Clear, concise help text for 10+ fields
- [ ] Tooltips don't block other content

**Story Points**: 3

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use Radix UI Tooltip component
- Implement with proper ARIA (aria-describedby)
- Position tooltips intelligently (avoid viewport overflow)
- Consider link to FAQ for more detailed help

**Labels**: frontend, ux, forms, accessibility

---

## 🔌 EPIC 5: API & Backend Improvements

**Epic Description**: Enhance backend APIs for better performance, reliability, and developer experience.

**Business Value**: More robust system, easier to maintain, better API for future integrations.

### Tickets

#### BLOOM-501: Implement API Versioning

**Story**: As a developer, I want API versioning so that we can make breaking changes without affecting existing clients.

**Acceptance Criteria**:

- [ ] API routes include version prefix (e.g., /api/v1/applications)
- [ ] Current endpoints migrated to /v1
- [ ] Version negotiation via URL path or Accept header
- [ ] Documentation clearly shows versioning strategy
- [ ] Deprecation policy defined (support N-1 version)
- [ ] Version sunset warnings in API responses

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use URL path versioning (simpler for REST APIs)
- Consider semantic versioning (v1.0, v1.1, v2.0)
- Document breaking vs non-breaking changes
- Plan v2 changes: pagination, filtering, sorting

**Labels**: backend, api, architecture

---

#### BLOOM-502: Add API Request Validation Middleware

**Story**: As a backend developer, I want centralized request validation so that we catch invalid data before it reaches business logic.

**Acceptance Criteria**:

- [ ] Validation middleware implemented for all endpoints
- [ ] Schema-based validation (JSON Schema or Zod)
- [ ] Validation errors return consistent format (RFC 7807 Problem Details)
- [ ] Request size limits enforced
- [ ] Content-Type validation
- [ ] SQL injection and XSS prevention

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use Zod for TypeScript schema validation
- Return 400 Bad Request with detailed errors
- Log validation failures for monitoring
- Consider OpenAPI spec generation from schemas

**Labels**: backend, api, security

---

#### BLOOM-503: Implement Paginated API Responses

**Story**: As a developer, I want paginated API responses so that we don't return thousands of records in a single request.

**Acceptance Criteria**:

- [ ] GET /api/applications supports pagination (page, pageSize params)
- [ ] Default page size: 25, max: 100
- [ ] Response includes: total, page, pageSize, totalPages
- [ ] HATEOAS links for next/prev pages
- [ ] Cursor-based pagination for large datasets (optional)
- [ ] Documentation with examples

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-501

**Technical Notes**:

- Use offset-based pagination initially
- Consider cursor-based for better performance at scale
- Include `X-Total-Count` header
- Support sorting via query params (sort=created_at:desc)

**Labels**: backend, api, performance

---

#### BLOOM-504: Add API Filtering and Sorting

**Story**: As an admin, I want to filter and sort applications via API so that I can find specific records quickly.

**Acceptance Criteria**:

- [ ] Filter by status, date range, email, AHPRA number
- [ ] Sort by created_at, updated_at, last_name (ascending/descending)
- [ ] Multiple filters can be combined (AND logic)
- [ ] Query params are validated and sanitized
- [ ] Documentation shows available filters
- [ ] Database indexes support efficient filtering

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-503, BLOOM-302

**Technical Notes**:

- Use query string format: ?status=submitted&sort=-created_at
- Implement safe query building (prevent SQL injection)
- Add database indexes for filtered columns
- Consider search functionality (full-text search)

**Labels**: backend, api, database

---

#### BLOOM-505: Implement API Response Compression

**Story**: As a mobile user, I want compressed API responses so that I use less data and get faster responses.

**Acceptance Criteria**:

- [ ] Gzip compression enabled for all API responses
- [ ] Brotli compression for modern browsers
- [ ] Compression applied to responses > 1KB
- [ ] Proper Content-Encoding headers set
- [ ] Response size reduced by 60-80%
- [ ] Monitoring shows compression ratio

**Story Points**: 3

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Azure Functions supports compression by default
- Ensure compression level balances CPU vs size
- Test with various payloads (JSON, HTML)
- Consider pre-compressing static assets

**Labels**: backend, api, performance

---

#### BLOOM-506: Add API Health Check Endpoint

**Story**: As an SRE, I want a health check endpoint so that we can monitor API availability and dependencies.

**Acceptance Criteria**:

- [ ] GET /api/health endpoint returns 200 OK if healthy
- [ ] Checks database connectivity
- [ ] Checks blob storage connectivity
- [ ] Returns response time for each dependency
- [ ] Includes version and build info
- [ ] Used by Azure health probes
- [ ] Logged for uptime monitoring

**Story Points**: 3

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Return 503 Service Unavailable if any dependency fails
- Implement timeout for dependency checks (5s max)
- Cache health status to avoid overwhelming dependencies
- Structure: `{ status: "healthy", dependencies: { db: "ok", storage: "ok" } }`

**Labels**: backend, api, monitoring, devops

---

## 👔 EPIC 6: Admin Portal Features

**Epic Description**: Enhance admin portal with features that improve workflow and decision-making.

**Business Value**: Faster application processing, better insights, reduced manual work.

### Tickets

#### BLOOM-601: Implement Bulk Actions for Applications

**Story**: As an admin, I want to perform bulk actions so that I can process multiple applications at once.

**Acceptance Criteria**:

- [ ] Multi-select checkboxes for applications
- [ ] Bulk actions: Approve, Reject, Archive, Export
- [ ] Confirmation modal before executing bulk actions
- [ ] Progress indicator for long-running bulk operations
- [ ] Audit log records bulk actions
- [ ] Works with filtered/searched results

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-104

**Technical Notes**:

- Implement select all (current page) and select all (all pages)
- Handle partial failures gracefully
- Consider queue-based processing for large batches
- Optimistic UI updates with rollback on error

**Labels**: frontend, admin, ux

---

#### BLOOM-602: Add Advanced Search and Filtering

**Story**: As an admin, I want advanced search so that I can find applications quickly using multiple criteria.

**Acceptance Criteria**:

- [ ] Search bar with autocomplete for names, emails, AHPRA numbers
- [ ] Filter panel with: status, date range, qualifications, specializations
- [ ] Saved filter presets (e.g., "Pending clinical psychologists")
- [ ] Clear all filters button
- [ ] URL updates with search/filter params (shareable links)
- [ ] Search results highlight matching terms

**Story Points**: 13

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-504

**Technical Notes**:

- Debounce search input (300ms)
- Consider full-text search with Azure Cognitive Search
- Store filter presets in user profile
- Use query string for state persistence

**Labels**: frontend, admin, ux, backend

---

#### BLOOM-603: Create Application Review Workflow

**Story**: As an admin, I want a structured review workflow so that applications move through consistent stages.

**Acceptance Criteria**:

- [ ] Workflow stages: New → Screening → Review → Interview → Decision
- [ ] Each stage has required fields/checklist
- [ ] Stage transitions logged in audit trail
- [ ] Visual workflow diagram in UI
- [ ] Reminders for applications stuck in stages > 7 days
- [ ] Workflow rules configurable (e.g., auto-reject if missing docs)

**Story Points**: 21

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-104, BLOOM-703

**Technical Notes**:

- Use state machine pattern for workflow
- Consider workflow engine (Azure Logic Apps)
- Store workflow history in separate table
- Allow reverting to previous stage with reason

**Labels**: backend, frontend, admin, workflow

---

#### BLOOM-604: Add Notes and Comments System

**Story**: As a reviewer, I want to add notes to applications so that I can communicate with team members.

**Acceptance Criteria**:

- [ ] Add note/comment to any application
- [ ] Notes visible to all admins
- [ ] Editable and deletable by author
- [ ] Rich text editor for formatting
- [ ] File attachments on notes (optional)
- [ ] Activity feed shows notes with timestamps
- [ ] Email notification when mentioned (@username)

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: BLOOM-104, BLOOM-301 (Email notifications)

**Technical Notes**:

- Store notes in separate table (application_notes)
- Implement markdown or rich text (Quill, TipTap)
- Consider real-time updates (SignalR or polling)
- Support @mentions with autocomplete

**Labels**: frontend, backend, admin, collaboration

---

#### BLOOM-605: Implement Export Functionality

**Story**: As an admin, I want to export application data so that I can analyze it in Excel or share with stakeholders.

**Acceptance Criteria**:

- [ ] Export to CSV, Excel (XLSX), PDF
- [ ] Exports respect current filters/search
- [ ] Customize columns to export
- [ ] Export includes related data (notes, status history)
- [ ] Large exports processed asynchronously with download link
- [ ] Export history tracked in audit log

**Story Points**: 8

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use libraries: papaparse (CSV), xlsx (Excel), pdfmake (PDF)
- Consider Azure Function for async export processing
- Stream large exports to avoid memory issues
- Limit export size (e.g., 10,000 records max)

**Labels**: frontend, backend, admin, reporting

---

#### BLOOM-606: Add Dashboard Analytics Widgets

**Story**: As a manager, I want dashboard analytics so that I can track application metrics at a glance.

**Acceptance Criteria**:

- [ ] Widgets: Applications by status, applications over time (chart), avg processing time
- [ ] Interactive charts (click to filter)
- [ ] Date range selector (Last 7 days, 30 days, Quarter, Year)
- [ ] Export widget data to CSV
- [ ] Widgets configurable (show/hide)
- [ ] Real-time updates (every 5 minutes)

**Story Points**: 13

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use recharts for data visualization
- Implement dashboard layout with drag-and-drop (react-grid-layout)
- Cache aggregated data for performance
- Consider Azure Application Insights for metrics

**Labels**: frontend, admin, analytics, ux

---

## 📊 EPIC 7: Monitoring & Analytics

**Epic Description**: Implement comprehensive monitoring and analytics to understand system health and user behavior.

**Business Value**: Proactive issue detection, data-driven decisions, better uptime.

### Tickets

#### BLOOM-701: Implement Application Insights Integration

**Story**: As an SRE, I want Application Insights so that we can monitor performance and diagnose issues.

**Acceptance Criteria**:

- [ ] Application Insights SDK integrated in frontend and backend
- [ ] Custom events tracked (page views, button clicks, form submissions)
- [ ] Exceptions and errors logged automatically
- [ ] Performance metrics captured (API response times, page load times)
- [ ] User flows tracked (funnels)
- [ ] Dashboards created in Azure Portal

**Story Points**: 8

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use Application Insights JavaScript SDK for frontend
- Azure Functions have built-in integration
- Track custom dimensions (user type, feature flags)
- Set up alerts for error rates and slow requests

**Labels**: monitoring, devops, frontend, backend

---

#### BLOOM-702: Set Up Error Tracking and Reporting

**Story**: As a developer, I want error tracking so that I'm notified of production errors immediately.

**Acceptance Criteria**:

- [ ] Error tracking service configured (Sentry, Application Insights, or similar)
- [ ] Frontend errors captured (JavaScript errors, API failures)
- [ ] Backend errors captured (function failures, database errors)
- [ ] Error context includes: user ID, URL, browser info, stack trace
- [ ] Email/Slack alerts for critical errors
- [ ] Error dashboard shows trends and top errors

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use Sentry for rich error context and grouping
- Implement global error boundary in React
- Filter out known errors (network offline, ad blockers)
- Set up source maps for meaningful stack traces

**Labels**: monitoring, devops, frontend, backend

---

#### BLOOM-703: Implement User Analytics and Behavior Tracking

**Story**: As a product manager, I want user analytics so that I understand how users interact with the application.

**Acceptance Criteria**:

- [ ] Analytics tool integrated (Google Analytics 4, Mixpanel, or Application Insights)
- [ ] Track page views, button clicks, form field interactions
- [ ] Funnel analysis for application submission flow
- [ ] A/B test results tracked automatically
- [ ] User segmentation (new vs returning, mobile vs desktop)
- [ ] Privacy-compliant (GDPR, CCPA)

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use GA4 for general analytics, Application Insights for custom events
- Implement event naming convention
- Respect user privacy preferences (cookie consent)
- Track abandonment points in forms

**Labels**: monitoring, analytics, frontend, privacy

---

#### BLOOM-704: Create Uptime Monitoring and Alerting

**Story**: As an SRE, I want uptime monitoring so that we're alerted immediately when the site goes down.

**Acceptance Criteria**:

- [ ] External uptime monitor configured (Pingdom, UptimeRobot, Azure Monitor)
- [ ] Checks run every 1-5 minutes
- [ ] Multi-region checks (Australia, US, Europe)
- [ ] Alert channels: Email, SMS, Slack
- [ ] Status page for public uptime visibility (optional)
- [ ] SLA tracking (99.9% uptime target)

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: BLOOM-506

**Technical Notes**:

- Use Azure Monitor availability tests
- Check both homepage and /api/health endpoint
- Set up escalation policy (alert dev after 5 min, manager after 15 min)
- Create public status page with Statuspage.io or similar

**Labels**: monitoring, devops, infrastructure

---

#### BLOOM-705: Implement Performance Monitoring

**Story**: As a performance engineer, I want performance monitoring so that we can identify slow pages and optimize them.

**Acceptance Criteria**:

- [ ] Core Web Vitals tracked (LCP, FID, CLS)
- [ ] API response times monitored
- [ ] Database query times tracked
- [ ] Performance budgets defined (e.g., LCP < 2.5s)
- [ ] Alerts when budgets are exceeded
- [ ] Performance dashboard showing trends

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-701

**Technical Notes**:

- Use web-vitals library for Core Web Vitals
- Send metrics to Application Insights custom events
- Monitor P50, P95, P99 percentiles
- Set up performance alerts in Azure

**Labels**: monitoring, performance, frontend, backend

---

## 📧 EPIC 8: Email & Notifications

**Epic Description**: Implement email notifications and communication features to keep users informed.

**Business Value**: Better user engagement, reduced support inquiries, improved communication.

### Tickets

#### BLOOM-801: Set Up Email Infrastructure

**Story**: As a developer, I want email infrastructure so that we can send transactional emails reliably.

**Acceptance Criteria**:

- [ ] Email service configured (SendGrid, Azure Communication Services, or Postmark)
- [ ] DKIM, SPF, DMARC configured for deliverability
- [ ] Email templates designed (HTML + plain text fallback)
- [ ] Unsubscribe mechanism implemented
- [ ] Bounce and complaint handling
- [ ] Email sending queue for reliability

**Story Points**: 8

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use SendGrid or Azure Communication Services
- Store email templates in separate files or CMS
- Implement retry logic for failed sends
- Track email delivery status (sent, delivered, opened, bounced)

**Labels**: backend, email, infrastructure

---

#### BLOOM-802: Send Application Confirmation Email

**Story**: As an applicant, I want a confirmation email so that I know my application was received.

**Acceptance Criteria**:

- [ ] Email sent immediately after application submission
- [ ] Email includes: submission ID, date, next steps
- [ ] Branded email template with Bloom design
- [ ] Link to application status page (future feature)
- [ ] Plain text version for accessibility
- [ ] Email delivery tracked

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-801

**Technical Notes**:

- Send email asynchronously (don't block submission)
- Use email queue to handle failures
- Personalize with applicant name
- Include FAQ link and contact info

**Labels**: backend, email, ux

---

#### BLOOM-803: Send Admin Notification Emails

**Story**: As an admin, I want email notifications so that I'm alerted to new applications and status changes.

**Acceptance Criteria**:

- [ ] Email sent to admin team when new application submitted
- [ ] Daily digest email with pending applications count
- [ ] Email when application is assigned to reviewer
- [ ] Configurable notification preferences per admin
- [ ] Option to mute notifications
- [ ] Links directly to application in admin portal

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-801, BLOOM-103

**Technical Notes**:

- Store notification preferences in user profile
- Use background job for digest emails (Azure Function timer trigger)
- Implement unsubscribe for digest emails
- Consider Slack integration as alternative

**Labels**: backend, email, admin, notifications

---

#### BLOOM-804: Implement Status Change Notifications

**Story**: As an applicant, I want email notifications so that I know when my application status changes.

**Acceptance Criteria**:

- [ ] Email sent when application is approved, rejected, or needs more info
- [ ] Personalized message based on status
- [ ] Next steps clearly outlined
- [ ] Contact information for questions
- [ ] Opt-out mechanism
- [ ] Template for each status type

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-801

**Technical Notes**:

- Trigger emails from status change logic
- Use email queue for reliability
- A/B test different email copy for approval emails
- Track open rates and conversion to onboarding

**Labels**: backend, email, ux, notifications

---

#### BLOOM-805: Add In-App Notifications

**Story**: As a user, I want in-app notifications so that I see important updates without checking email.

**Acceptance Criteria**:

- [ ] Notification bell icon in header with badge count
- [ ] Notification panel slides out on click
- [ ] Notifications: Application status changes, new features, system maintenance
- [ ] Mark as read functionality
- [ ] Dismiss/delete notifications
- [ ] Notifications persist across sessions
- [ ] Unread count displayed

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Store notifications in database (user_notifications table)
- Use WebSockets or polling for real-time updates
- Implement notification preferences (which events to notify)
- Consider push notifications for mobile (future)

**Labels**: frontend, backend, ux, notifications

---

## 📚 EPIC 9: Documentation & Developer Experience

**Epic Description**: Improve documentation and developer experience to accelerate onboarding and reduce errors.

**Business Value**: Faster onboarding, fewer bugs, better collaboration.

### Tickets

#### BLOOM-901: Create API Documentation with OpenAPI/Swagger

**Story**: As a developer, I want API documentation so that I can integrate with the API without reading source code.

**Acceptance Criteria**:

- [ ] OpenAPI 3.0 specification created for all endpoints
- [ ] Interactive API documentation (Swagger UI or Redoc)
- [ ] Request/response examples for each endpoint
- [ ] Authentication flow documented
- [ ] Error codes and messages documented
- [ ] Hosted at /api/docs
- [ ] Kept up-to-date automatically

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use @azure/functions-openapi for automatic spec generation
- Host Swagger UI on static page
- Generate client SDKs from OpenAPI spec
- Include Postman collection export

**Labels**: documentation, backend, api, devops

---

#### BLOOM-902: Write Component Documentation with Storybook

**Story**: As a frontend developer, I want component documentation so that I can see how to use UI components.

**Acceptance Criteria**:

- [ ] Storybook configured and running
- [ ] Stories for all reusable components (buttons, forms, cards)
- [ ] Props documented with types and defaults
- [ ] Accessibility notes for each component
- [ ] Visual regression tests in Storybook
- [ ] Deployed to static hosting (Netlify, Vercel)

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use Storybook for React
- Integrate with existing design system
- Add a11y addon for accessibility checks
- Generate docs automatically from TypeScript types

**Labels**: documentation, frontend, design-system

---

#### BLOOM-903: Create Developer Onboarding Guide

**Story**: As a new developer, I want an onboarding guide so that I can set up my environment and contribute quickly.

**Acceptance Criteria**:

- [ ] Step-by-step setup instructions (prerequisites, installation, running locally)
- [ ] Troubleshooting section for common issues
- [ ] Architecture diagram and explanation
- [ ] Coding standards and conventions
- [ ] Git workflow and branching strategy
- [ ] How to run tests
- [ ] How to deploy

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Update README.md with comprehensive guide
- Include screenshots and code examples
- Link to external resources (Azure docs, React docs)
- Keep up-to-date with onboarding feedback

**Labels**: documentation, devops

---

#### BLOOM-904: Set Up Automated Changelog Generation

**Story**: As a product manager, I want automated changelogs so that we can communicate changes to stakeholders.

**Acceptance Criteria**:

- [ ] Conventional commits enforced (feat, fix, chore, etc.)
- [ ] Changelog generated automatically on release
- [ ] Grouped by type (Features, Bug Fixes, Breaking Changes)
- [ ] Linked to GitHub issues/PRs
- [ ] Published to CHANGELOG.md
- [ ] Included in release notes

**Story Points**: 3

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use standard-version or conventional-changelog
- Enforce conventional commits with commitlint
- Run changelog generation in CI/CD pipeline
- Consider semantic versioning automation

**Labels**: documentation, devops, ci-cd

---

#### BLOOM-905: Create Architecture Decision Records (ADRs)

**Story**: As a technical lead, I want ADRs so that we document important technical decisions and rationale.

**Acceptance Criteria**:

- [ ] ADR template created (Context, Decision, Consequences)
- [ ] ADRs stored in `/docs/adr/` directory
- [ ] At least 5 initial ADRs documented (tech stack, database choice, auth approach)
- [ ] Process for creating new ADRs defined
- [ ] ADRs linked from main documentation
- [ ] ADRs included in PR review process

**Story Points**: 5

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use markdown format for ADRs
- Number ADRs sequentially (001-choice-of-database.md)
- Keep ADRs immutable (supersede with new ADRs)
- Include date, status (proposed, accepted, deprecated)

**Labels**: documentation, architecture

---

## 🗄️ EPIC 10: Database & Data Management

**Epic Description**: Improve database design, data integrity, and management capabilities.

**Business Value**: Better data quality, easier maintenance, scalability.

### Tickets

#### BLOOM-1001: Implement Database Migration System

**Story**: As a developer, I want database migrations so that we can version and deploy schema changes safely.

**Acceptance Criteria**:

- [ ] Migration tool configured (Flyway, Liquibase, or db-migrate)
- [ ] All schema changes in migration files
- [ ] Migrations run automatically on deployment
- [ ] Rollback capability for failed migrations
- [ ] Migration history tracked in database
- [ ] Documentation on creating migrations

**Story Points**: 8

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use Azure SQL Database-compatible migration tool
- Store migrations in `/migrations` directory
- Number migrations sequentially (001_initial_schema.sql)
- Test migrations on staging before production

**Labels**: database, devops, backend

---

#### BLOOM-1002: Add Database Backup and Recovery

**Story**: As a DBA, I want automated backups so that we can recover from data loss or corruption.

**Acceptance Criteria**:

- [ ] Daily automated backups configured
- [ ] Point-in-time recovery enabled (7 days retention minimum)
- [ ] Backup verification process
- [ ] Recovery runbook documented
- [ ] Backup/restore tested quarterly
- [ ] Backup monitoring and alerts

**Story Points**: 5

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Azure SQL Database has built-in backups
- Configure long-term retention (LTR) for compliance
- Document restore procedure
- Test restore to separate database

**Labels**: database, devops, infrastructure

---

#### BLOOM-1003: Implement Soft Deletes for Applications

**Story**: As an admin, I want to recover accidentally deleted applications so that we don't lose data permanently.

**Acceptance Criteria**:

- [ ] Add `deleted_at` column to applications table
- [ ] Delete operations set `deleted_at` instead of removing row
- [ ] Queries exclude soft-deleted records by default
- [ ] Admin can view and restore deleted applications
- [ ] Audit log tracks deletions and restorations
- [ ] Hard delete after 90 days (GDPR compliance)

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-104

**Technical Notes**:

- Add `deleted_at` timestamp column (nullable)
- Update queries: `WHERE deleted_at IS NULL`
- Create restore endpoint: PUT /api/applications/{id}/restore
- Implement background job for permanent deletion

**Labels**: database, backend, data-management

---

#### BLOOM-1004: Add Data Validation at Database Level

**Story**: As a DBA, I want database constraints so that we prevent invalid data from being stored.

**Acceptance Criteria**:

- [ ] NOT NULL constraints on required fields
- [ ] CHECK constraints for enums (status, qualification_type)
- [ ] UNIQUE constraint on email
- [ ] Foreign key constraints where applicable
- [ ] Default values for timestamps
- [ ] Database constraints documented

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: BLOOM-1001

**Technical Notes**:

- Add constraints in migration
- Test constraint violations return proper errors
- Update API to handle constraint errors gracefully
- Document constraints in schema diagram

**Labels**: database, backend, data-quality

---

#### BLOOM-1005: Implement Data Archiving Strategy

**Story**: As a DBA, I want old applications archived so that we maintain database performance and compliance.

**Acceptance Criteria**:

- [ ] Archive policy defined (e.g., archive applications > 2 years old)
- [ ] Archive table created for cold storage
- [ ] Automated archiving job runs monthly
- [ ] Archived data accessible via separate API (read-only)
- [ ] Restore from archive capability
- [ ] Archiving tracked in audit log

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: BLOOM-1001

**Technical Notes**:

- Create separate schema or database for archives
- Use Azure Function timer trigger for archiving job
- Compress archived data (gzip)
- Consider blob storage for very old records

**Labels**: database, backend, data-management, compliance

---

#### BLOOM-1006: Add Database Performance Monitoring

**Story**: As a DBA, I want database performance metrics so that we can identify and fix slow queries.

**Acceptance Criteria**:

- [ ] Query performance insights enabled in Azure SQL
- [ ] Slow query log analyzed weekly
- [ ] Missing index recommendations reviewed
- [ ] Database DTU usage monitored
- [ ] Alerts for high DTU usage (> 80%)
- [ ] Performance dashboard created

**Story Points**: 5

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use Azure SQL Query Performance Insight
- Set up Azure Monitor for database metrics
- Create custom dashboard in Azure Portal
- Document query optimization process

**Labels**: database, monitoring, performance

---

## 📝 Additional Cross-Cutting Tickets

### BLOOM-1101: Implement Feature Flags

**Story**: As a product manager, I want feature flags so that we can deploy code without immediately enabling features.

**Acceptance Criteria**:

- [ ] Feature flag system implemented (LaunchDarkly, Azure App Configuration, or custom)
- [ ] Flags can be toggled without deployment
- [ ] Frontend and backend support flags
- [ ] Flags for major features defined
- [ ] Percentage rollouts supported (e.g., 10% of users see new feature)
- [ ] Flag management UI for non-technical users

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use Azure App Configuration Feature Manager
- Wrap features in flag checks: `if (isFeatureEnabled('new-dashboard')) { ... }`
- Consider user targeting (show to specific users)
- Clean up flags after full rollout

**Labels**: devops, frontend, backend, feature-management

---

### BLOOM-1102: Set Up Staging Environment

**Story**: As a developer, I want a staging environment so that we can test changes before production.

**Acceptance Criteria**:

- [ ] Staging environment deployed to Azure
- [ ] Separate database and storage for staging
- [ ] CI/CD deploys to staging on merge to `develop` branch
- [ ] Staging URL: `staging.bloom.life-psychology.com.au`
- [ ] Staging data seeded with realistic test data
- [ ] Staging reset weekly to prevent data bloat

**Story Points**: 8

**Priority**: P1 (High)

**Dependencies**: None

**Technical Notes**:

- Use Azure Static Web Apps staging slots
- Separate resource group for staging
- Use Azure DevOps or GitHub Actions for deployment
- Document staging vs production differences

**Labels**: devops, infrastructure, ci-cd

---

### BLOOM-1103: Implement CI/CD Pipeline Improvements

**Story**: As a developer, I want improved CI/CD so that deployments are faster and more reliable.

**Acceptance Criteria**:

- [ ] Pipeline runs in < 10 minutes
- [ ] Parallel job execution where possible
- [ ] Caching for dependencies (node_modules)
- [ ] Automatic rollback on failed deployment
- [ ] Deployment approval for production
- [ ] Deployment notifications (Slack, email)

**Story Points**: 8

**Priority**: P2 (Medium)

**Dependencies**: None

**Technical Notes**:

- Use GitHub Actions or Azure DevOps
- Cache node_modules between runs
- Implement blue-green deployment for zero downtime
- Add smoke tests after deployment

**Labels**: devops, ci-cd

---

### BLOOM-1104: Add Multi-Language Support (i18n)

**Story**: As a non-English speaker, I want the application in my language so that I can use it more easily.

**Acceptance Criteria**:

- [ ] i18n framework configured (react-i18next)
- [ ] Language switcher in header
- [ ] At least 2 languages supported (English + 1 other)
- [ ] All user-facing text translated
- [ ] Date, time, and number formatting localized
- [ ] Language preference saved
- [ ] RTL support for applicable languages

**Story Points**: 21

**Priority**: P3 (Low)

**Dependencies**: None

**Technical Notes**:

- Use react-i18next or react-intl
- Store translations in JSON files
- Consider Phrase, Lokalise for translation management
- Test with pseudo-localization for string expansion

**Labels**: frontend, ux, i18n

---

### BLOOM-1105: Implement Progressive Web App (PWA) Features

**Story**: As a mobile user, I want to install the app on my home screen so that I can access it like a native app.

**Acceptance Criteria**:

- [ ] Web app manifest configured
- [ ] Service worker for offline support
- [ ] Install prompt on mobile devices
- [ ] App icons for various devices (iOS, Android)
- [ ] Splash screen for installed app
- [ ] Lighthouse PWA score 90+

**Story Points**: 13

**Priority**: P3 (Low)

**Dependencies**: BLOOM-305

**Technical Notes**:

- Use Vite PWA plugin
- Configure manifest.json with app metadata
- Test installation on iOS and Android
- Consider push notifications (requires backend support)

**Labels**: frontend, pwa, mobile

---

## 🎯 Priority Matrix

### Must Have (P0-P1) - First 3-6 Months

1. **BLOOM-1002**: Database Backup and Recovery (P0)
2. **BLOOM-1102**: Set Up Staging Environment (P1)
3. **BLOOM-101**: API Rate Limiting (P1)
4. **BLOOM-201**: Unit Testing Framework (P1)
5. **BLOOM-202**: Integration Tests (P1)
6. **BLOOM-301**: Frontend Code Splitting (P1)
7. **BLOOM-502**: API Request Validation (P1)
8. **BLOOM-701**: Application Insights Integration (P1)
9. **BLOOM-702**: Error Tracking (P1)
10. **BLOOM-704**: Uptime Monitoring (P1)
11. **BLOOM-801**: Email Infrastructure (P1)
12. **BLOOM-1001**: Database Migration System (P1)

### Should Have (P2) - Next 6-12 Months

- Security enhancements (BLOOM-102, 103, 104, 106)
- Performance optimizations (BLOOM-302, 303, 705)
- UX improvements (BLOOM-401, 402, 405)
- Admin features (BLOOM-601, 602, 606)
- API improvements (BLOOM-501, 503, 504, 506)
- Monitoring (BLOOM-703)
- Email notifications (BLOOM-802, 803, 804)
- Documentation (BLOOM-901, 903)
- Database improvements (BLOOM-1003, 1004, 1006)

### Could Have (P3) - Future/Nice to Have

- Advanced UX (BLOOM-403, 404, 406)
- Additional testing (BLOOM-203, 204, 206)
- Performance extras (BLOOM-304, 305)
- Admin extras (BLOOM-604, 605)
- Notifications (BLOOM-805)
- Documentation extras (BLOOM-902, 904, 905)
- Data management (BLOOM-1005)
- Feature flags (BLOOM-1101)
- PWA features (BLOOM-1104, 1105)

---

## 📊 Estimation Summary

**Total Story Points by Epic:**

| Epic                  | Story Points | Avg per Ticket |
| --------------------- | ------------ | -------------- |
| Epic 1: Security      | 47           | 7.8            |
| Epic 2: Testing       | 55           | 9.2            |
| Epic 3: Performance   | 47           | 9.4            |
| Epic 4: UX & A11y     | 37           | 6.2            |
| Epic 5: API           | 34           | 5.7            |
| Epic 6: Admin         | 76           | 12.7           |
| Epic 7: Monitoring    | 34           | 6.8            |
| Epic 8: Email         | 37           | 7.4            |
| Epic 9: Documentation | 34           | 6.8            |
| Epic 10: Database     | 41           | 6.8            |
| Cross-Cutting         | 58           | 11.6           |

**Total: ~500 Story Points** (approximately 10-15 developer-months of work)

---

## 🏁 Getting Started with Jira

### Step 1: Create the Board

1. Go to Jira → Create Board → Kanban
2. Name: "Bloom Web App Development"
3. Project: Create new project "BLOOM"

### Step 2: Create Epics

Create 10 epics (BLOOM-EPIC-1 through BLOOM-EPIC-10) using the epic descriptions above.

### Step 3: Create Stories

Copy ticket details from this document into Jira stories. For each story:

- **Summary**: Use the ticket title
- **Description**: Paste the full ticket content (Story, Acceptance Criteria, Technical Notes)
- **Epic Link**: Link to appropriate epic
- **Story Points**: Use the provided estimate
- **Priority**: Use the suggested priority
- **Labels**: Add provided labels

### Step 4: Configure Board

- **Columns**: To Do → In Progress → In Review → Done
- **WIP Limits**: In Progress (5), In Review (3)
- **Swimlanes**: Group by Epic or Priority
- **Quick Filters**: By Priority, By Label, By Story Points

### Step 5: Prioritize

- Drag tickets to order them by priority within each column
- Focus on P0-P1 tickets first
- Consider dependencies when ordering

---

## 📞 Support & Questions

This roadmap is a living document. As priorities shift and new requirements emerge, tickets can be:

- **Re-prioritized**: Move between P0-P3 based on business needs
- **Re-estimated**: Adjust story points as understanding improves
- **Split**: Break large tickets (13+ points) into smaller ones
- **Combined**: Merge related small tickets for efficiency
- **Archived**: Remove if no longer relevant

**Questions or suggestions?** Update this document and share with the team.

---

**Document Status**: ✅ Ready for Jira Import
**Last Updated**: November 22, 2025
**Next Review**: Quarterly or as needed
