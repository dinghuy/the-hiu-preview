# The Hiu Villa Website — Interactive Mockup Prototype v1

## How to Run Locally
Run a local static HTTP server from this directory:
```bash
python3 -m http.server 4500 --bind 127.0.0.1
```
Then open `http://127.0.0.1:4500` in your web browser.

## Overview & Architecture
This is an interactive mock prototype built for stakeholder evaluation before live property launch. It integrates all decisions confirmed on 2026-11-04 and 2026-11-05, built upon **Taste DNA** (anti-slop hospitality, warm linen ground, genuine editorial type, equal container edges) and **Scroll-Craft** (5-act feeling curve, dimensional layered hero, variety of device families across sections).

### Key Features Implemented:
1. **Act 1: Arrive (Dimensional Layered Hero)**
   - Pinned background courtyard plate + midground living pavilion frame.
   - Transparent starting rate badge (`From $350 / night · Whole Villa`).
   - Dual CTAs: Instant WhatsApp Chat and Check Dates & Rates anchor.
   - Equal weight OTA discovery trigger.
2. **Act 2: Discover (Living Flow & Space)**
   - Two distinct stay contexts: `01 / Gather & Unwind` (family/friends) vs `02 / Stay & Focus` (remote workation).
   - High-resolution real villa photography from internal assets.
3. **Act 3: Picture the Stay (Accommodations & Floorplan)**
   - Structured bedroom cards: Suite 01 (Master King), Suite 02 (Garden Queen), Suite 03 (Family Twin) with bed configurations, bathroom details, and square meterage.
   - Architectural Floorplan SVG diagram clearly mapping ground level and upper level spaces.
4. **Act 4: Plan with Confidence (Pricing & Verified Process)**
   - Standard Rate Schedule: Weekday vs weekend pricing, turnover housekeeping, and refundable security deposit.
   - Interactive Stay Estimator: Calculates total villa rate and dynamic per-person per-night price when dates or guest count are toggled.
   - 3-Step Direct Booking Process: Inquiry -> 2-hour host confirmation -> Secure reservation.
5. **Act 5: Close (Hybrid Enquiry Module)**
   - Pre-filled WhatsApp inquiry draft generator encoding check-in/out dates, guest count, stay purpose, and custom notes directly into WhatsApp click-to-chat URL.
   - Direct empty chat fallback.
   - External OTA channel comparison modal (Airbnb & Booking.com).

## Compliance & Disclaimer
This is an internal design preview prototype. Property selection, publication rights, live pricing, and verified hosting channels remain pending formal owner mandate under TASKS.md. No live payments or customer PII are collected.
