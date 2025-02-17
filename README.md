# Universe 25 Simulation

A web-based simulation inspired by the Universe 25 experiment, demonstrating population dynamics in a closed environment. The simulation features autonomous agents interacting in a resource-limited space, with beautiful visualizations and real-time statistics.

## Features

- 🎮 Full-screen 2D simulation with ASCII-style graphics
- 🤖 Autonomous agents with complex behaviors
- 📊 Real-time statistics and visualization
- 🎨 Retro-inspired aesthetic with modern visual effects
- ⚡ Multiple simulation speeds (0.25x to 4x)
- 📱 Responsive design for all screen sizes

## Tech Stack

### Frontend Framework & Build Tools
- Vite (v6.1.0) - Modern build tool and development server
- TypeScript - For type-safe JavaScript development

### Graphics & Rendering
- p5.js - Creative coding library for graphics and interactive visualizations
- HTML5 Canvas - Used through p5.js for rendering

### Core Technologies
- HTML5
- CSS3 (with modern features):
  - CSS Variables (custom properties)
  - Flexbox for layout
  - CSS Grid
  - Modern animations and transitions
  - Backdrop filters

### Key Dependencies
- p5 - For creative coding and visualization
- @types/p5 - TypeScript type definitions for p5.js

### Development Tools
- npm - Package manager
- TypeScript compiler
- ESLint - For code linting
- Vite's hot module replacement (HMR)

## Requirements

- Node.js 16.x or higher
- Modern web browser with ES6+ support
- Minimum screen resolution: 320px width

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd universe-25
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Usage

1. Open the application in your browser
2. Configure simulation parameters:
   - Initial Population
   - Resource Capacity
   - Birth Rate
   - Time Scale
   - Resource Distribution
3. Click "Start Simulation" to begin
4. Use keyboard controls:
   - Press `T` to toggle movement trails
   - Press `~` to toggle debug console

## Architecture

The project follows a modular architecture with three main components:

1. **SimulationEngine**
   - Handles core simulation logic
   - Manages agent states and behaviors
   - Controls resource distribution
   - Processes time-based updates

2. **Renderer**
   - Manages visual representation
   - Handles canvas drawing
   - Controls animations and effects
   - Manages UI overlays

3. **UIController**
   - Handles user input
   - Manages parameter forms
   - Controls simulation stats display
   - Manages responsive layout

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by John B. Calhoun's Universe 25 experiment
- Built with modern web technologies
- Special thanks to the p5.js community 