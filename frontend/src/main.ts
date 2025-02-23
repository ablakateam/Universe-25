import './style.css';
import { SimulationEngine } from './lib/SimulationEngine';
import { Renderer } from './lib/Renderer';
import { UIController } from './lib/UIController';

// Global state management
let ui: UIController;
let currentEngine: SimulationEngine | null = null;
let currentRenderer: Renderer | null = null;
let isRunning = false;
let currentAnimationFrame: number | null = null;

const UTOPIA_PRESET = {
    initialPopulation: 15,          // Reduced to prevent early overcrowding
    resourceCapacity: 300,          // Increased to ensure sufficient resources
    birthRate: 0.08,                // Lowered to prevent population explosions
    timeScale: 1,                   // Keep normal speed for observation
    resourceSpots: 12,              // More spots for better distribution
    resourceRegenerationRate: 0.4   // Faster regeneration to maintain sustainability
};

function cleanupSimulation() {
    if (currentAnimationFrame !== null) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }

    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    }

    if (currentEngine) {
        currentEngine = null;
    }
    if (currentRenderer) {
        currentRenderer = null;
    }
    isRunning = false;
}

function initializeUI() {
    const form = document.getElementById('parameter-form') as HTMLFormElement;
    
    // Add preset buttons section
    const presetSection = document.createElement('div');
    presetSection.className = 'preset-buttons';
    
    const utopiaButton = document.createElement('button');
    utopiaButton.className = 'preset-button utopia';
    utopiaButton.textContent = 'Utopia Preset';
    utopiaButton.type = 'button';  // Prevent form submission
    utopiaButton.addEventListener('click', () => {
        console.log('Setting Utopia preset parameters...');
        
        // Set form values to utopia preset
        const inputs = {
            initialPopulation: document.getElementById('initialPopulation') as HTMLInputElement,
            resourceCapacity: document.getElementById('resourceCapacity') as HTMLInputElement,
            birthRate: document.getElementById('birthRate') as HTMLInputElement,
            timeScale: document.getElementById('timeScale') as HTMLSelectElement,
            resourceSpots: document.getElementById('resourceSpots') as HTMLInputElement,
            resourceRegenerationRate: document.getElementById('resourceRegenerationRate') as HTMLInputElement
        };

        console.log('Found form elements:', Object.keys(inputs).filter(key => inputs[key as keyof typeof inputs] !== null));

        if (inputs.initialPopulation) inputs.initialPopulation.value = UTOPIA_PRESET.initialPopulation.toString();
        if (inputs.resourceCapacity) inputs.resourceCapacity.value = UTOPIA_PRESET.resourceCapacity.toString();
        if (inputs.birthRate) inputs.birthRate.value = UTOPIA_PRESET.birthRate.toString();
        if (inputs.timeScale) inputs.timeScale.value = UTOPIA_PRESET.timeScale.toString();
        if (inputs.resourceSpots) inputs.resourceSpots.value = UTOPIA_PRESET.resourceSpots.toString();
        if (inputs.resourceRegenerationRate) inputs.resourceRegenerationRate.value = UTOPIA_PRESET.resourceRegenerationRate.toString();

        console.log('Utopia preset applied:', UTOPIA_PRESET);
    });
    
    presetSection.appendChild(utopiaButton);
    form.insertBefore(presetSection, form.firstChild);
}

async function startSimulation() {
    try {
        cleanupSimulation();
        
        if (ui) {
            ui.showLoadingIndicator();
        }

        const params = ui?.getSimulationParams() || UTOPIA_PRESET;
        console.log('Starting simulation with parameters:', params);

        currentEngine = new SimulationEngine(params);
        currentRenderer = new Renderer(currentEngine);

        if (ui) {
            ui.hideParameterForm();
            ui.hideLoadingIndicator();
        }

        isRunning = true;
        let lastPopulation = currentEngine.getStats().population;
        let noPopulationTicks = 0;

        function update() {
            if (!isRunning || !currentEngine) return;

            try {
                const timeScale = currentEngine.getParams().timeScale;
                for (let i = 0; i < timeScale; i++) {
                    currentEngine.update();
                }
                
                const stats = currentEngine.getStats();
                if (ui) {
                    ui.updateConsole(stats);
                    ui.updateStats(stats);
                }
                
                if (stats.population === 0) {
                    noPopulationTicks++;
                    if (noPopulationTicks > 60) {
                        isRunning = false;
                        console.log('Simulation ended - Population extinct');
                        ui?.showRestartButton(() => {
                            cleanupSimulation();
                            ui?.showParameterForm();
                        });
                        return;
                    }
                } else {
                    noPopulationTicks = 0;
                    lastPopulation = stats.population;
                }
                
                currentAnimationFrame = requestAnimationFrame(update);
            } catch (error) {
                console.error('Error in simulation loop:', error);
                isRunning = false;
                ui?.showError('Simulation error occurred. Please try again.');
                cleanupSimulation();
            }
        }

        console.log('Starting simulation loop');
        update();
    } catch (error) {
        console.error('Error starting simulation:', error);
        ui?.hideLoadingIndicator();
        ui?.showError('Failed to initialize simulation. Please try again.');
        cleanupSimulation();
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    try {
        currentEngine = new SimulationEngine(UTOPIA_PRESET);
        console.log('Engine created');
        
        ui = new UIController(currentEngine);
        console.log('UI Controller created');

        // Initialize UI elements including the Utopia preset button
        initializeUI();
        console.log('UI initialized with preset buttons');

        const form = document.getElementById('parameter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted, starting simulation...');
                startSimulation();
            });
        } else {
            console.error('Parameter form not found');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        if (ui) {
            ui.showError('Failed to initialize application. Please refresh the page.');
        }
    }
}); 