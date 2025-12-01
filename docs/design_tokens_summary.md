# Design Token Structure Summary

This document summarizes the design token structure observed in the Figma file, focusing on the variable collections and their connections.

## Overview

The design system appears to be structured into at least two distinct levels of variable collections:
1.  **Primitive / Brand Collection**: Defines the core color palette and raw values.
2.  **Mapped / Semantic Collection**: Defines context-specific tokens (Foreground, Background, Border) that reference the primitive values.

## 1. Primitive / Brand Collection

This collection houses the raw color values, likely serving as the "Brand" or "Global" palette. The naming convention follows a standard scale (e.g., `color/500`).

**Observed Primitives:**
*   **Red**: `red/500` (#f26863)
*   **Orange**: `orange/500` (#ff9233)
*   **Yellow**: `yellow/500` (#ffe270)
*   **Green**: `green/500` (#4ee07d)
*   **Blue**: `blue/500` (#639edf)
*   **Purple**: `purple/500` (#b176e5)
*   **Pink**: `pink/500` (#fb88aa)

*Note: The presence of `500` implies a fuller scale (100-900) likely exists in the full system, though only these were observed in the inspected node.*

## 2. Mapped / Semantic Collection

This collection abstracts the raw values into usage-specific tokens. These tokens likely alias the Primitive collection, creating a "connection point" that allows for theming and consistent updates.

### Connections & Aliasing

The connection between the **Brand Alias** (Primitives) and the **Mapped Collection** is evident in the shared values between semantic tokens and their primitive counterparts.

**Key Mappings:**

| Semantic Token (Mapped) | Value | Inferred Primitive Alias |
| :--- | :--- | :--- |
| `foreground/error` | `#f26863` | `red/500` |
| `border/error` | `#f26863` | `red/500` |
| `foreground/warning` | `#ff9233` | `orange/500` |
| `border/warning` | `#ff9233` | `orange/500` |

### Token Categories

#### Foreground
Controls text and icon colors.
*   **Text**: `foreground/headings` (#000000), `foreground/body` (#030712), `foreground/subtle` (#1e2939), `foreground/inverse` (#ffffff), `foreground/on disabled` (#90a1b9).
*   **Status**: `foreground/error`, `foreground/warning`, `foreground/success-hover`, `foreground/warning-hover`, `foreground/error-hover`.

#### Background
Controls surface and fill colors.
*   **Surface**: `background/page` (#ffffff), `background/default` (#ffffff), `background/elevated` (#f9fafb), `background/subtle` (#d1d5dc).
*   **Action**: `background/action` (#101828), `background/secondary` (#99bcdf), `background/disabled` (#e2e8f0).
*   **Status**: `background/success` (#90e3ab), `background/warning` (#ffb677), `background/error` (#ffa2a2).
*   **Status Subtle**: `background/success-subtle` (#effbf3), `background/warning-subtle` (#fff4eb), `background/error-subtle` (#fef1f1).

#### Border
Controls stroke colors.
*   **Structural**: `border/primary` (#030712), `border/strong` (#364153), `border/default` (#99a1af), `border/disabled` (#90a1b9).
*   **Status**: `border/error`, `border/warning`, `border/success-hover`.

## 3. Typography & Spacing

The system also utilizes structured tokens for typography and layout.

*   **Typography**: Composite tokens like `text-6xl/font-bold` combine `font-family`, `font-size`, `font-weight`, and `line-height` variables.
    *   *Families*: `Figtree`
    *   *Scales*: `font-size/0` to `font-size/9`
*   **Spacing**: `gap/*` and `padding/*` tokens (e.g., `gap/sm` (4px), `gap/md` (8px), `gap/xl` (16px)).
*   **Radius**: `corner radius/default` (4px), `corner radius/lg` (8px), `corner radius/full` (9999px).

## Summary of Connections

The design token structure relies on a strong separation of concerns:
1.  **Value Definition**: The **Primitive** collection defines *what* the colors are (e.g., `#f26863`).
2.  **Contextual Application**: The **Mapped** collection defines *how* they are used (e.g., `foreground/error`).

This connection ensures that changing `red/500` in the Primitive collection would automatically propagate to `foreground/error` and `border/error`, maintaining consistency across the application.
