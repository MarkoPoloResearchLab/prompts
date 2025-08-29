# Prompt Bubbles

Prompt Bubbles is a static website that presents a curated collection of ChatGPT prompts.

## Development

Ensure high code quality

1. Use descriptive names, never use a single letter or abbreviated names
2. Write code documentation (doc format, go docs), never use comments in the code. Document functions and modules. If
   you see a comment, move it to documentation of the code.
3. Focus on existing code and consider using the existing code over writing new code.
4. Use constants for strings, when it makes sense. Don't sprinkle code with strings

## Data Source

The prompts are read from a JSON file. The JSON has the following schema

{
"id": "uniqueID",
"title": titkle string",
"text": "The prompt text",
"tags": [ array of strings ]
}

### Dependencies

Leverage Beer.css as much as possible: [Beer CSS documentation](beercss-docs-clean.md).

DO not write custom classes if Beer.css has a class that does the same thing.

## PRD

The interface uses an HTML page with separate JavaScript and CSS files, allowing filtering and copying of prompts
directly in the browser.

### 1. Header Row (Top Bar)

**Always visible (sticky, top:0).**

* **Left:** Title (icon + “Prompt Bubbles”), left-aligned.
* **Center:** Search field. Expands to fill space between title and theme switch.
* **Right:** Theme switch, right-aligned and vertically centered with the title.

#### Responsiveness

* **Wide (≥1024px):** Single row: Title (L), Search (C), Switch (R).
* **Medium (600–1023px):** Title + Switch on first row; Search wraps to second row (full width).
* **Small (<600px):** Three rows: Title (row 1), Switch (row 2, right-aligned), Search (row 3, full width).

#### Behavior

* Always visible (sticky).
* Header and tags row form a fixed top block; body scrolls beneath.

---

### 2. Tags Row (Global Filters)

**Always visible (sticky, directly below header).**

* **Single line only.** All tags must fit into one line.
* **Scaling:** Tags shrink uniformly (down to 60% of base size) to ensure single-line fit.
* **Padding adjustment:** Horizontal paddings reduce before shrinking further.
* **No wrapping, no horizontal scroll.**

---

### 3. Site Body (Cards Grid)

**Scrollable content area.**

* **Grid layout:** Responsive auto-fit with min card width \~320–360px.

    * 1 column on phones, 2 columns on tablets, 3–4 on desktops.
    * Constant gutters between cards.
* **Scrolling:** When content exceeds viewport height, body scrolls; header+tags remain pinned.

---

#### 3a. Card Skeleton (Inflexible Proportions)

Each card is divided into **two vertical regions**:

* **Top region (\~70% of height):**

    * **Title row:** Single line, ellipsis if truncated.
    * **Tags row:** Directly below title. Always a single line. Shrinks (down to 55%) if needed.
    * **Body:** Remaining space of top region. Truncates or clips with fade if overflow.

* **Bottom region (\~30% of height):**

    * **Copy button:** Pinned bottom-right.
    * **Status indicator (“Copied ✓”):**

        * Appears in **bottom-left corner**.
        * Pale green color.
        * Does not reflow or overlap other regions.

* **Alignment:** Title, tags, and body share one invisible vertical line (same left margin). Copy button/indicator are
  pinned inside the bottom region, not affecting text alignment.

---

### 4. Footer (Copyright Line)

* **Stuck to page bottom.**
* With short content: sits at viewport bottom (min-height:100vh shell).
* With long content: only visible after scrolling; not sticky.
* Copyright 2025 Marko Polo Research Lab
