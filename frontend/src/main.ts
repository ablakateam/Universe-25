import './style.css';
import { SimulationEngine } from './lib/SimulationEngine';
import { Renderer } from './lib/Renderer';
import { UIController } from './lib/UIController';

// Create UI Controller
const ui = new UIController();

// Keep track of current simulation objects
let currentEngine: SimulationEngine | null = null;
let currentRenderer: Renderer | null = null;
let isRunning = false;
let currentAnimationFrame: number | null = null;

// Create simulation container
const simulationContainer = document.createElement('div');
simulationContainer.id = 'simulation-container';
document.body.appendChild(simulationContainer);

const UTOPIA_PRESET = {
    initialPopulation: 20,
    resourceCapacity: 200,
    birthRate: 0.15,
    timeScale: 1,
    resourceSpots: 8,
    resourceRegenerationRate: 0.3
};

function cleanupSimulation() {
    // Cancel any ongoing animation frame
    if (currentAnimationFrame !== null) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }

    // Remove the canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    }

    // Hide simulation container and related UI
    simulationContainer.classList.remove('active');

    // Reset simulation objects
    currentEngine = null;
    currentRenderer = null;
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

// Function to start simulation
async function startSimulation() {
    // Clean up any existing simulation
    cleanupSimulation();

    // Get parameters and create simulation
    const params = ui.getSimulationParams();
    console.log('Simulation parameters:', params);
    
    // Show loading indicator
    ui.showLoadingIndicator();
    
    try {
        currentEngine = new SimulationEngine(params);
        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Show simulation container
        simulationContainer.classList.add('active');
        
        currentRenderer = new Renderer(currentEngine);

        // Hide the form and loading indicator
        ui.hideParameterForm();
        ui.hideLoadingIndicator();

        isRunning = true;
        let lastPopulation = params.initialPopulation;
        let noPopulationTicks = 0;

        // Start the simulation loop
        function update() {
            if (!isRunning) return;

            // Update simulation multiple times based on time scale
            for (let i = 0; i < params.timeScale; i++) {
                currentEngine?.update();
            }
            
            // Update console if visible
            const stats = currentEngine?.getStats();
            if (stats) {
                ui.updateConsole(stats);
                
                // Check if simulation should end
                if (stats.population === 0) {
                    noPopulationTicks++;
                    // Wait a short while to ensure it's not just a temporary state
                    if (noPopulationTicks > 60) { // About 1 second at 60fps
                        isRunning = false;
                        console.log('Simulation ended - Population extinct');
                        ui.showRestartButton(() => {
                            cleanupSimulation();
                        });
                        return;
                    }
                } else {
                    noPopulationTicks = 0;
                    lastPopulation = stats.population;
                }
            }
            
            // Store the animation frame ID
            currentAnimationFrame = requestAnimationFrame(update);
        }

        // Start the update loop
        console.log('Starting simulation loop');
        update();
    } catch (error) {
        console.error('Error starting simulation:', error);
        ui.hideLoadingIndicator();
        ui.showError('Failed to initialize simulation. Please try again.');
        cleanupSimulation();
    }
}

// Handle initial form submission
document.getElementById('parameter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    startSimulation();
});

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Wait a short moment for the UIController to create the form
    setTimeout(() => {
        console.log('Initializing UI...');
        initializeUI();
    }, 100);
}); 