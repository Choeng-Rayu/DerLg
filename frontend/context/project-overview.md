# DerLg.com

## Overview

DerLg.com is a Cambodia travel booking Progressive Web App that helps travelers discover, plan, and book experiences in Cambodia. The platform combines AI-powered trip planning with traditional booking flows for hotels, transportation, and local tour guides. It targets international tourists, regional Southeast Asian travelers (Chinese market), and local Khmer-speaking users who want a curated, culturally-authentic experience. The app is installable as a PWA with offline map support and a persistent AI chat concierge.

## Goals

1. **Production-ready UI** — Replace placeholder AI-generated styling with a cohesive, branded design aligned to the DerLg forest green identity
2. **Mobile-first travel experience** — Optimized for phones (primary device), with responsive desktop support
3. **Trust and conversion** — Design that communicates quality, safety, and local expertise to convert browsers into bookers
4. **Cultural authenticity** — Visual language that reflects Cambodia's heritage (Angkor, temples, festivals, landscapes)

## Core User Flow

### Discovery & Booking
1. User lands on Home — hero photography, featured trips, categories, upcoming festivals
2. User explores places via Explore page (interactive map + place cards + filters)
3. User opens a trip/place detail — gallery, cultural info, reviews, pricing
4. User initiates booking — selects dates, travelers, add-ons
5. User completes payment — Stripe card or local QR code (ABA Pay / Wing)
6. User receives confirmation — booking details, receipt, QR ticket

### AI-Assisted Planning
1. User opens AI Chat (floating button or bottom nav Chat tab)
2. AI concierge asks about preferences, budget, dates
3. AI returns personalized itinerary with trip cards inside chat
4. User confirms — AI creates booking directly from chat
5. Payment handled inline in chat interface

### Trip Management
1. User goes to My Trip — upcoming and past bookings list
2. User taps booking — full detail, status timeline, cancellation options
3. Emergency SOS button always accessible from any main page

## Features

### Core Booking
- Hotel search, filter, detail, book
- Transportation (minibus, tuk-tuk, private car) booking
- Tour guide browse, profile, book
- Curated multi-day trip package booking

### Discovery
- Explore page with interactive Leaflet map (offline tile caching)
- Historical places, cultural sites, landmarks
- Festival calendar with alerts
- Smart search with filters (price, category, location, rating)

### AI Concierge
- Real-time WebSocket chat (Python AI Agent backend)
- Itinerary generation and budget estimation
- Booking initiation from chat
- Weather info, travel tips, cultural insights
- QR payment display inside chat

### User Account
- JWT authentication (access token in memory, refresh in httpOnly cookie)
- Profile management, avatar upload
- Loyalty points display and history
- Student discount verification (upload student ID)
- Preferences (language, currency, notification settings)

### Safety
- Emergency SOS floating button (always visible on main pages)
- Emergency contacts sheet (police, hospital, embassy, DerLg support)
- Offline emergency info cached via Service Worker

### PWA & Offline
- Installable to home screen (Web App Manifest)
- Offline map tiles via Service Worker (Cache First strategy)
- Offline action queue in IndexedDB — syncs on reconnect
- Push notifications for booking updates and festival alerts

### Internationalization
- English (EN) — primary and default
- Khmer (KH) — for local Cambodian users (Noto Sans Khmer font)
- Chinese (ZH) — for Chinese regional market

## Scope

### In Scope (UI Redesign)
- All pages in `app/(main)/`, `app/(auth)/`, `app/chat/`
- All components in `components/`
- CSS design token system in `app/globals.css`
- shadcn/ui component installation in `components/ui/`
- PWA manifest theme color

### Out of Scope
- Backend API contracts
- Auth logic, token handling
- Data fetching (hooks, stores, React Query)
- Business logic in `lib/`, `hooks/`, `stores/`, `context/`
- Admin dashboard (low priority, internal tool)
- New features or routes not already defined

## Success Criteria

1. Every page uses the forest green design system with no hardcoded hex values
2. shadcn/ui components handle all interactive elements (Button, Input, Select, Dialog, Sheet, etc.)
3. Mobile experience fully usable — bottom nav, safe area insets, touch targets ≥ 44px
4. Light and dark modes work via CSS variable switching (next-themes)
5. Khmer font renders correctly on KH locale pages
6. Emergency button always visible, never obscured by other floating elements
7. AI Chat button does not overlap bottom navigation on mobile
8. `npm run build` passes with zero TypeScript errors after redesign
