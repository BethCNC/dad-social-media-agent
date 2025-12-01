## Design Token Structure – Figma Variable Collections

This document summarizes the design token structure used in the Figma file for the Unicity app (`unicity-app` file in Figma: [`unicity app – Figma`](https://www.figma.com/design/KlfWQrqtZGeWkDT3vL8Zyu/unicity-app?node-id=21-25658&t=knWAe8X3mYMtLW2Z-1)).

It focuses on:
- **Which variable collections exist**
- **How primitive (brand) values feed into mapped (semantic) tokens**
- **Where the connection point between the “brand alias” and mapped collection lives**

---

## 1. Collections & Layers of Tokens

At a high level, the system is organized into layered collections:

1. **Primitive / Brand collection**
   - Stores the **raw color values** for the Unicity palette.
   - Tokens are named by **hue + numeric scale** (e.g. `red/500`).
2. **Mapped / Semantic UI collection**
   - Stores **usage-based tokens** like `foreground/*`, `background/*`, `border/*`.
   - Each semantic token is an **alias** to a primitive value from the Brand collection.

In Figma’s variable UI, this means:
- The **Primitive / Brand** collection holds the base hex values.
- The **Mapped / Semantic** collection defines aliases that **reference those base values**, so you never use primitives directly in components—only mapped tokens.

---

## 2. Primitive / Brand Collection (Core Palette)

The Brand collection defines the core palette that everything else builds on.

- **Naming pattern**: `<hue>/<step>` (e.g. `red/500`)
- **Observed mid-scale brand colors**:
  - `red/500` – `#f26863`
  - `orange/500` – `#ff9233`
  - `yellow/500` – `#ffe270`
  - `green/500` – `#4ee07d`
  - `blue/500` – `#639edf`
  - `purple/500` – `#b176e5`
  - `pink/500` – `#fb88aa`

These serve as **single sources of truth**. Any change to, for example, `red/500` propagates through all aliases that reference it.

---

## 3. Mapped / Semantic Collection (UI Tokens)

The mapped collection translates raw brand values into **meaningful, UI-facing tokens**. These tokens are what the product should use.

### 3.1 Color Categories

- **Foreground tokens** – text and icon colors.
  - Examples:
    - `foreground/headings` – `#000000`
    - `foreground/body` – `#030712`
    - `foreground/subtle` – `#1e2939`
    - `foreground/inverse` – `#ffffff`
    - `foreground/on disabled` – `#90a1b9`
    - Status variants like `foreground/error`, `foreground/warning`, `foreground/success-hover`, etc.

- **Background tokens** – surface and fill colors.
  - Examples:
    - `background/page` – `#ffffff`
    - `background/default` – `#ffffff`
    - `background/elevated` – `#f9fafb`
    - `background/subtle` – `#d1d5dc`
    - `background/action` – `#101828`
    - `background/secondary` – `#99bcdf`
    - `background/disabled` – `#e2e8f0`
    - Status fills:
      - `background/success` – `#90e3ab`
      - `background/warning` – `#ffb677`
      - `background/error` – `#ffa2a2`
      - Subtle variants: `background/*-subtle`

- **Border tokens** – strokes and outlines.
  - Examples:
    - `border/primary` – `#030712`
    - `border/strong` – `#364153`
    - `border/default` – `#99a1af`
    - `border/disabled` – `#90a1b9`
    - Status variants: `border/error`, `border/warning`, `border/success-hover`

### 3.2 Explicit Connections (Brand → Semantic)

Several semantic tokens clearly alias brand primitives via matching values:

| Semantic token (mapped) | Hex value | Underlying brand primitive |
|-------------------------|-----------|-----------------------------|
| `foreground/error`      | `#f26863` | `red/500`                  |
| `border/error`          | `#f26863` | `red/500`                  |
| `foreground/warning`    | `#ff9233` | `orange/500`               |
| `border/warning`        | `#ff9233` | `orange/500`               |

These demonstrate the **connection point**:

- The semantic token (e.g. `foreground/error`) belongs to the **Mapped / Semantic** collection.
- Its value is **not a hard-coded hex**; it is an **alias to a Brand primitive** (e.g. `red/500`) inside the Brand collection.

Changing `red/500` in the Brand collection updates:
- `foreground/error`
- `border/error`
- Any other semantic tokens pointing at `red/500`

This pattern appears to repeat for the other status colors as well.

---

## 4. Non-Color Tokens (Type, Spacing, Radius)

The Figma file also defines structured, composable variables for typography and layout:

- **Typography**
  - Composite tokens such as `text-6xl/font-bold` bundle:
    - `font-family` (e.g. Figtree)
    - `font-size` (`font-size/0` … `font-size/9`)
    - `font-weight`
    - `line-height`

- **Spacing**
  - `gap/*` and `padding/*` tokens
  - Examples:
    - `gap/sm` – 4px
    - `gap/md` – 8px
    - `gap/xl` – 16px

- **Radius**
  - Corner radius tokens:
    - `corner radius/default` – 4px
    - `corner radius/lg` – 8px
    - `corner radius/full` – 9999px

These follow the same philosophy: **primitives + mapped usage tokens**, though the aliasing is most critical and obvious in the color system.

---

## 5. Mental Model & Implementation Notes

- **Primitives define brand DNA**
  - The Primitive / Brand collection owns the “true” values (hex colors, base sizes).
- **Mapped tokens define UI meaning**
  - Foreground, background, and border tokens describe *how* and *where* colors are used.
- **Brand ↔ Mapped connection point**
  - In Figma, semantic variables in the mapped collection are set to **alias** variables from the Brand collection rather than hex values.
  - This allows:
    - **Easy theming or palette shifts**: update a brand primitive once.
    - **Stable UI contracts**: code and components always consume the same semantic names, regardless of underlying brand tweaks.

For engineering, this suggests mirroring the same structure in code:
- One layer of **brand primitives** (e.g. `color.red.500`).
- One layer of **semantic UI tokens** (e.g. `color.foreground.error`) that reference those primitives.

