# Universe 25 Simulation

A web-based simulation inspired by John Calhoun's Universe 25 experiment, demonstrating population dynamics in a closed environment.

## Project Overview

This simulation recreates the famous behavioral sink experiment in a digital format, using modern web technologies to visualize and analyze population dynamics in a confined space.

### Core Features
- Full-screen 2D simulation environment
- ASCII-based agent representation with enhanced visual effects
- Real-time population statistics and analysis
- Interactive parameter configuration
- Collapsible sidebar with detailed simulation information
- Responsive design supporting various screen sizes

## Technical Architecture

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
  - Flexbox and Grid layouts
  - Modern animations and transitions
  - Backdrop filters
  - Responsive design principles

## Project Structure
```
/frontend
├── src/
│   ├── lib/
│   │   ├── SimulationEngine.ts    # Core simulation logic
│   │   ├── Renderer.ts            # Visual rendering system
│   │   └── UIController.ts        # User interface management
│   ├── style.css                  # Global styles and animations
│   └── main.ts                    # Application entry point
├── index.html                     # Main HTML template
└── package.json                   # Project dependencies
```

### Key Components

1. SimulationEngine
   - Manages simulation state and logic
   - Handles agent behavior and interactions
   - Controls resource distribution
   - Tracks population statistics

2. Renderer
   - Manages p5.js canvas setup and drawing
   - Handles agent visualization
   - Implements visual effects and animations
   - Manages canvas resizing and responsiveness

3. UIController
   - Manages parameter input and validation
   - Controls sidebar behavior
   - Handles real-time statistics display
   - Manages tooltips and user interactions

## Current Features

### Simulation Core
- Agent lifecycle management
- Resource distribution system
- Population dynamics
- State-based behavior system

### User Interface
- Interactive parameter configuration
- Collapsible sidebar with live statistics
- Real-time agent activity tracking
- Enhanced visual feedback
- Responsive layout adaptation

### Visualization
- ASCII-based agent representation
- State-specific colors and symbols
- Smooth animations and transitions
- Resource visualization
- Trail system for movement tracking

## Planned Features

### Short Term
- Enhanced population analytics
- Advanced visualization options
- Improved mobile support
- Additional customization options

### Long Term
- Save/Load simulation states
- Advanced behavior patterns
- Environmental factors
- Population genetics

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow modular architecture
- Implement responsive design patterns
- Maintain clean, documented code

### Performance
- Optimize canvas rendering
- Efficient state management
- Smooth animations and transitions
- Responsive UI updates

### Testing
- Unit tests for core logic
- Performance benchmarks
- Cross-browser compatibility
- Mobile device testing

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access the simulation at `http://localhost:5173`

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.