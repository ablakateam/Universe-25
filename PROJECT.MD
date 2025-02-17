Project Overview
We’re building a web-based simulation that demonstrates population dynamics in a closed environment (inspired by Universe 25). The simulation must:

Run in a full-screen 2D view (canvas or another rendering surface).
Use ASCII characters (or small sprite-like symbols) as agents for a fun, indie aesthetic.
Include a toggleable console overlay for debug or stats info.
Be largely autonomous (the user inputs parameters, then the simulation runs on its own).
Provide a whimsical/cute vibe through color, simple animations, and layout.
The end result should feel like a small “indie game” or a digital “toy” that runs in the browser.

Task Breakdown
1. Project Setup & Architecture
Tech Stack:

Front-end:
JavaScript and TypeScript.
A library like p5.js, Phaser.js, or Pixi.js could simplify 2D rendering. However, pure Canvas API or SVG can also work if ASCII styling is the priority.
Back-end (if needed for data persistence or advanced logic):
Node.js with an Express or Fastify server (alternatively, a serverless approach is possible if we only need to store minimal data).
Build Tools:
Use a modern bundler like Vite, Webpack, or Parcel to compile front-end assets.
Folder Structure (example):

css
Copy
Edit
/project-root
 ├─ /backend       (Node.js/Express if needed)
 ├─ /frontend
 │   ├─ /src
 │   │   ├─ main.js (or main.ts)
 │   │   ├─ simulation.js (core simulation logic)
 │   │   ├─ rendering.js (ASCII or Canvas rendering logic)
 │   │   └─ ui.js (console toggle, parameter input, etc.)
 │   └─ index.html
 ├─ package.json
 └─ README.md
2. Front-End Requirements
Fullscreen 2D Simulation

The simulation should occupy the entire browser window.
Handle window resizing gracefully.
ASCII Agents

Each agent is represented by an ASCII character (for example, “@”, “*”, “o”, etc.).
Potentially colorize or animate them slightly (e.g., a small “bounce” animation or color changes).
The environment could be an ASCII “grid” or use a hybrid approach (ASCII characters rendered onto an HTML canvas or <pre> element).
Toggleable Console

A small in-page console can be toggled with a key press (e.g., the “~” key or a button in a corner).
When visible, it shows debug information:
Current population, resource levels, tick count, etc.
Possibly logs interesting events (e.g., “New agent born,” “Agent X starved”).
This console should overlay on top of the simulation without disrupting it.
Initial Parameter Entry

A minimal form or an overlay to set up:
Initial Population
Resource Capacity
Birth Rate
(Optional) Time Scale (1×, 2×, 4×, etc.)
After these are submitted, the simulation goes full screen and runs autonomously.
Cute/Indie Aesthetic

Use a limited color palette (e.g., pastel backgrounds, minimal neon text).
Simple animations or transitions (e.g., fade in/out, subtle floaty movement).
Agents might have small “wobble” or “dance” animations.
3. Simulation Logic
Core Mechanics

Agents: Each with properties such as age, hunger, position, etc.
Resources: A global or distributed resource count (food, water, space).
Behaviors:
Movement or “drift” within a 2D or grid environment.
Resource consumption.
Reproduction if certain conditions are met (available resources, space, partner search, etc.).
Mortality conditions (old age, starvation, or overcrowding stress).
Time Steps & Autonomy

Each “tick” (or frame), agents update their state.
No user interaction required after starting.
If time scaling is used, handle multiple updates per render or adjust the “delta time” each tick.
Data Tracking

Track metrics like total population, births, deaths, resource usage over time.
Possibly log data for final results or live charting (optional).
4. Back-End (Optional)
Depending on the project scope, the back-end might be quite minimal or not needed at all (if purely front-end). But if you want to save/load simulations or do heavier computations:

Endpoints:

POST /start to store initial parameters.
GET /status to retrieve current simulation state (for multi-client usage or logging).
POST /save or GET /load for persisting states in a database.
Database:

A lightweight solution like SQLite or a NoSQL DB (e.g., MongoDB) to store saved states.
Real-time:

If real-time data streaming is desired, consider using WebSockets so front-end can connect to a back-end simulation that’s running continuously.
5. Implementation Steps
Front-End Initialization

Create the index.html with a small parameter input section.
Add a “Start Simulation” button that hides the form and launches the full-screen mode.
Rendering & ASCII Setup

Decide on rendering approach:
A <canvas> with a text-based rendering (using a custom function to place ASCII glyphs).
A <pre> or <div>-grid approach for ASCII.
Implement a function that draws each agent’s ASCII character at a given coordinate.
Simulation Engine

Build a class (e.g., SimulationEngine) that maintains arrays for agents, resources, etc.
Implement update() for step-by-step logic (movement, consumption, reproduction).
Integrate optional time scaling: for (let i=0; i<timeScale; i++) { engine.update(); }
Console Overlay

A separate UI component that can be toggled with a button or key.
Displays real-time stats from the simulation.
Style it with a semi-transparent background so users can still see the ASCII environment behind it.
Styling & Theming

Add a consistent color palette (pastel backgrounds, gentle text colors).
Possibly some CSS transitions for toggling UI elements.
(Optional) Back-End Integration

If you need to store or retrieve states, set up basic Express routes or a serverless function.
Implement front-end fetch calls to save or load simulation data.
6. Deliverables
Fully Functional Front-End

Single-page application that starts with a parameter form and then shows the simulation in full screen.
ASCII-based agent rendering in real-time.
Toggleable console overlay.
Documentation

A brief README explaining:
How to run the project (e.g., npm install, npm run dev).
How to change default parameters or environment settings in code.
How to toggle the console and any special debug keys.
(If Included) Back-End Server

Node.js project with endpoints for saving/loading states.
Clear instructions for environment variables, database setup, or deployment.
7. Bonus / Future Enhancements
Custom ASCII “Skins”: Let the user pick different ASCII symbols or color palettes.
Procedural Terrain: Represent the environment as ASCII “tiles” (like a roguelike game).
Event Logging: In the console overlay, show messages when interesting events occur (e.g., “Agent #15 gave birth!”).
Charts: A small real-time chart or graph (e.g., with Chart.js or D3.js) showing population trend over time.
Localization: Provide multiple language options for any UI text.
Summary of the Task
Create a full-screen 2D web app that runs autonomously after receiving initial parameters.
Use ASCII characters (with possible color and small animations) to represent agents in the simulation.
Implement a toggleable console overlay that displays stats and debug messages in real time.
Maintain a cute/indie vibe via color palette, typography, and minimal but appealing animations.
Write clean, modular code so the simulation logic (update, render) is separate from UI concerns.
(Optional) Connect to a simple back-end if data persistence is required.
With these guidelines, you’ll have a clear scope for a Full Stack Developer (or primarily front-end if back-end is minimal) to build a neat Universe 25–inspired ASCII simulation that’s both visually engaging and technically robust.