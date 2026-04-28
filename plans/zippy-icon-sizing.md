# Plan: Zippy Icon Sizing Fix

**Branch:** feature/task-schema
**Date:** 2026-04-04

## Problem

In the teaching session chat sidebar, the Zippy (LumoMascot) avatar is rendered at
`size="small"` which maps to `width: 160, height: 180` px. The sidebar is 320-384px
wide (`md:w-80 lg:w-96`). A 160px icon consumes half the sidebar, leaving only ~148px
for message bubbles. The user avatar on the right is 40-44px (`w-10 h-10 md:w-11
md:h-11`) — Zippy should be in that same ballpark.

## Root Cause

`LumoMascot` size config (`LumoMascot.jsx:24`):
```js
small: { width: 160, height: 180, scale: 0.5 },
```
160px is the smallest available size. There is no chat-avatar-appropriate size.

ChatBubble uses `size="small"` in two places (`ChatBubble.jsx:33` typing indicator,
`ChatBubble.jsx:156` assistant bubble).

## What We Are NOT Changing

- Mascot SVG paths, animations, or emotion logic
- TeachingSession layout
- User bubble or ChatInput

## Changes

### 1. `src/components/LumoMascot.jsx` — add `xsmall` size

```js
// line 24, sizes object
xsmall: { width: 36, height: 40, scale: 0.11 },
```

Rationale: `viewBox="0 0 320 360"` at 40px height → scale 40/360 ≈ 0.11. Width
follows aspect ratio: 40 × (320/360) ≈ 36px. Matches the user avatar (`w-10 h-10`
= 40px) at nearly identical height.

### 2. `src/components/ChatBubble.jsx` — use `xsmall`

Two spots:

**Typing indicator (line 33):**
```jsx
// before
<LumoMascot emotion="thinking" size="small" />
// after
<LumoMascot emotion="thinking" size="xsmall" />
```

**Assistant bubble (line 156):**
```jsx
// before
<LumoMascot emotion={mood || 'curious'} size="small" />
// after
<LumoMascot emotion={mood || 'curious'} size="xsmall" />
```

## Result

| | Before | After |
|--|--------|-------|
| Zippy icon width | 160px | 36px |
| Space left for bubble in 320px sidebar | ~148px | ~272px |
| Matches user avatar size | No | Yes (~40px) |

## Files Touched

- `src/components/LumoMascot.jsx` — 1 line added to sizes config
- `src/components/ChatBubble.jsx` — 2 prop value changes

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

**VERDICT:** Simple 3-line UI fix. No review pipeline warranted.
