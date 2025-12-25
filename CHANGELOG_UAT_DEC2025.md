# Bloom Production Release - December 21-22, 2025

**Production:** https://www.lpapsychology.com.au  
**Commits:** 51 changes on `main` branch  
**Status:** ✅ Released to Production

---

## Changes in This Release

### 1. Booking Modal Improvements
- Mobile modal now full height (slide-up sheet style)
- Desktop calendar fills viewport without scrollbar
- All time slots visible without scrolling (8am-6pm)
- Fixed for Samsung Galaxy and iPhone Safari

### 2. GA4 Conversion Tracking
- New direct events for booking flow tracking

### 3. Facebook Sharing
- New sunflower-themed image when sharing on Facebook

### 4. Performance Optimizations
- Lazy load BookingForm (saves 52KB from initial bundle)
- Defer gtag.js to web worker via Partytown (eliminates 800ms blocking)
- Lazy load App Insights and PsychologistApplicationForm
- Defer initial page view tracking by 2s
- Optimize hero image sizes attribute

### 5. Bug Fixes
- Hero image no longer causes layout shift (explicit dimensions added)
- Email/phone fields stack correctly on mobile
- Mobile CTA bar loads availability on all pages
- Fixed `useRef` missing import causing production errors

---

## UAT Test Checklist

### 1. Booking Flow (Mobile + Desktop)
- [x] Go to homepage → Click "Book Now"
- [x] Modal opens smoothly, no layout jump
- [x] Select a date → All time slots visible (no scrolling needed)
- [x] Fill in details → Email and phone fields look correct
- [x] Complete a test booking (or cancel before payment)

### 2. Join Us Application
- [x] Scroll to bottom of homepage → Click "Join Us"
- [x] Fill out the practitioner application form
- [x] Submit → Should see confirmation message
- [x] Check email for application received confirmation

### 3. Social Sharing
- [x] Copy homepage URL → Paste into Facebook post (or use Facebook debugger)
- [x] Sunflower image should appear in preview

### 4. Lighthouse Performance Audit
- [x] Open Chrome DevTools → Lighthouse tab
- [x] Run audit on **Mobile** for homepage
- [x] Performance score: 90+

---

**Previous release:** Dec 20, 2025 | **This release:** Dec 21-22, 2025

