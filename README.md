
# Lianjia AI Studio

Lianjia AI Studio is a production-oriented creative workspace for real-estate video planning. It takes a plain script and turns it into a structured asset blueprint: characters, locations, sub-areas, and shot-level visual plans. The app is designed for teams that need to move from concept to consistent visual production quickly, while preserving brand tone and scene continuity.

This project is intentionally focused on a narrow but valuable workflow:

- parse a sales or promotional script into a production-ready blueprint
- generate consistent character and location reference images
- produce shot keyframes aligned with dialogue, action, and camera intent
- preserve progress locally so work can be resumed later
- keep the interface compact, operational, and easy to scan

## What It Does

Lianjia AI Studio acts like a lightweight pre-production desk for marketing content.

Instead of asking a creative team to manually break every script into assets, the app uses Gemini-powered analysis to produce a structured production plan. That plan becomes the working source of truth for:

- character consistency
- spatial consistency
- shot sequencing
- visual style alignment
- frame generation

The result is not just a text summary. It is a usable asset board where each object in the story can be locked, reviewed, and rendered into visual material.

## Core Workflow

1. Paste a script or use one of the included templates.
2. Let the engine extract the story structure into characters, locations, and shots.
3. Lock character or location references to establish a visual baseline.
4. Render individual shot frames from the blueprint.
5. Review logs, export frames, and continue iterating from the same local project state.

## Main Capabilities

### Script-to-Blueprint Parsing

The app reads a marketing script and turns it into a normalized production schema. The output includes:

- project title
- character list with traits and roles
- location list with descriptions and sub-areas
- shot list with order, action, dialogue, marketing point, camera intent, and casting

This gives the team a consistent structure before any image generation begins.

### Character Consistency

Each character can be locked as a visual reference image. That helps maintain:

- wardrobe continuity
- personality tone
- face and posture consistency
- role clarity across shots

### Location Consistency

Each location can be anchored with a reference render. Sub-areas support more precise scene planning, such as lobbies, meeting rooms, living rooms, or reception spaces.

### Shot Rendering

Every shot can be rendered independently as a visual keyframe. The model combines:

- location context
- involved characters
- action direction
- dialogue context
- camera guidance

This makes the shot board practical for review, iteration, and handoff.

### Session Persistence

Projects are saved in `localStorage`, so the most recent session can be restored automatically on reload.

## Technical Overview

The implementation is a React + Vite application with a small layered structure:

- `App.tsx` handles the main workspace UI
- `application/useProductionEngine.ts` manages the workflow state and orchestration
- `infrastructure/adapters.ts` wraps Gemini calls and storage access
- `domain/models.ts` defines the project schema and statuses

The engine is deliberately simple:

- the UI triggers workflow actions
- the application layer manages project state
- the infrastructure layer talks to Gemini and browser storage
- the domain layer keeps the data model explicit

## Architecture Notes

The project uses a clean separation between:

- presentation
- workflow orchestration
- AI integration
- persistence

That separation keeps the app easy to extend if the next version needs:

- richer asset editing
- multi-project management
- export pipelines
- team collaboration
- frame versioning
- remote persistence

## AI Integration

The app uses Google Gemini through `@google/genai`.

Current model usage:

- `gemini-3-flash-preview` for structured script analysis
- `gemini-2.5-flash-image` for image generation and image-based edits

The adapter layer also includes:

- retry logic with exponential backoff for transient errors
- image preprocessing for better payload size control
- prompt specialization for character and environment generation

## Environment Setup

### Prerequisites

- Node.js
- Gemini API key

### Local Configuration

Create a `.env.local` file with:

```bash
API_KEY=your_gemini_api_key_here
```

The Vite config maps `API_KEY` into `process.env.API_KEY` at build time.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
App.tsx                         # Main UI and workspace layout
application/useProductionEngine # Workflow state and actions
domain/models.ts                # Project and asset schema
infrastructure/adapters.ts      # Gemini + storage adapters
services/                       # Reserved service layer
index.tsx                       # App bootstrap
index.css                       # Global styling
```

## Design Philosophy

This app is built as a working studio, not a marketing site.

The interface emphasizes:

- dense but readable information layout
- strong visual hierarchy
- clear production states
- compact operational controls
- fast scanning of project assets

That makes it suitable for repeated use by creative, ops, or brand teams.

## Suggested Next Steps

The current codebase is a strong foundation for:

- prompt history and versioning
- manual asset editing
- exportable shot sheets
- watermarking and frame tagging
- cloud project storage
- collaborative review comments
- batch generation of scene variants

## License

No license file is included yet. Add one before sharing the project publicly.
