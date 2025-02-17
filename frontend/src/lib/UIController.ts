interface SimulationStats {
    population: number;
    tick: number;
    births: number;
    deaths: {
        starvation: number;
        oldAge: number;
        stress: number;
        total: number;
    };
    byState: Record<string, number>;
    avgStress: number;
    avgHunger: number;
    avgEnergy: number;
    totalResources: number;
}

interface SimulationParams {
    initialPopulation: number;
    resourceCapacity: number;
    birthRate: number;
    timeScale: number;
    resourceSpots: number;
    resourceRegenerationRate: number;
}

export class UIController {
    private container!: HTMLDivElement;
    private consoleOverlay!: HTMLDivElement;
    private restartButton!: HTMLButtonElement;
    private loadingOverlay!: HTMLDivElement;
    private errorOverlay!: HTMLDivElement;
    private isConsoleVisible: boolean = false;
    private lastParams: SimulationParams | null = null;
    private lastStats: SimulationStats | null = null;

    constructor() {
        this.setupUI();
        this.setupEventListeners();
    }

    private setupUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'ui-container';
        document.body.appendChild(this.container);

        // Create parameter form
        const form = this.createParameterForm();
        this.container.appendChild(form);

        // Create console overlay
        this.consoleOverlay = document.createElement('div');
        this.consoleOverlay.id = 'console-overlay';
        this.consoleOverlay.style.display = 'none';
        document.body.appendChild(this.consoleOverlay);

        // Create loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>Initializing Simulation...</p>
                <p class="loading-subtext">Fetching environmental data...</p>
            </div>
        `;
        this.loadingOverlay.style.display = 'none';
        document.body.appendChild(this.loadingOverlay);

        // Create error overlay
        this.errorOverlay = document.createElement('div');
        this.errorOverlay.id = 'error-overlay';
        this.errorOverlay.style.display = 'none';
        document.body.appendChild(this.errorOverlay);

        // Create restart button (hidden by default)
        this.restartButton = document.createElement('button');
        this.restartButton.id = 'restart-button';
        this.restartButton.innerHTML = 'Restart Simulation';
        this.restartButton.style.display = 'none';
        document.body.appendChild(this.restartButton);
    }

    private createParameterForm(): HTMLFormElement {
        const form = document.createElement('form');
        form.id = 'parameter-form';
        form.innerHTML = `
            <h2>Universe 25 Simulation</h2>
            <div class="form-section">
                <h3>Population Settings</h3>
                <div class="form-group">
                    <label for="initialPopulation">Initial Population:</label>
                    <div class="input-wrapper">
                        <input type="number" id="initialPopulation" value="10" min="1" max="100">
                        <div class="tooltip">
                            <h4>Initial Population</h4>
                            <p>The number of agents that will start in the simulation.</p>
                            <ul>
                                <li>Higher values = More crowded start</li>
                                <li>Lower values = Slower growth</li>
                                <li>Recommended: 10-20 for balanced growth</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">Number of agents at start</span>
                </div>
                <div class="form-group">
                    <label for="resourceCapacity">Maximum Population:</label>
                    <div class="input-wrapper">
                        <input type="number" id="resourceCapacity" value="50" min="1" max="500">
                        <div class="tooltip">
                            <h4>Maximum Population</h4>
                            <p>The environment's carrying capacity for agents.</p>
                            <ul>
                                <li>Higher values = More sustainable growth</li>
                                <li>Lower values = More competition</li>
                                <li>Affects stress levels and survival rates</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">Maximum sustainable population</span>
                </div>
                <div class="form-group">
                    <label for="birthRate">Birth Rate:</label>
                    <div class="input-wrapper">
                        <input type="number" 
                               id="birthRate" 
                               value="0.1" 
                               min="0" 
                               max="1" 
                               step="0.05"
                               pattern="\d*\.?\d*">
                        <div class="tooltip">
                            <h4>Birth Rate</h4>
                            <p>Probability of successful reproduction when agents meet.</p>
                            <ul>
                                <li>Higher values (0.2-0.3) = Faster population growth</li>
                                <li>Lower values (0.05-0.15) = More stable population</li>
                                <li>Recommended: 0.1-0.2 for balanced growth</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">Probability of reproduction (0-1, steps of 0.05)</span>
                </div>
            </div>

            <div class="form-section">
                <h3>Resource Settings</h3>
                <div class="form-group">
                    <label for="resourceSpots">Resource Spots:</label>
                    <div class="input-wrapper">
                        <input type="number" id="resourceSpots" value="5" min="1" max="20">
                        <div class="tooltip">
                            <h4>Resource Spots</h4>
                            <p>Number of food sources in the environment.</p>
                            <ul>
                                <li>More spots = Less competition</li>
                                <li>Fewer spots = More social interaction</li>
                                <li>Affects movement patterns and stress</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">Number of food sources</span>
                </div>
                <div class="form-group">
                    <label for="resourceRegenerationRate">Resource Regeneration:</label>
                    <div class="input-wrapper">
                        <input type="number" id="resourceRegenerationRate" value="0.1" min="0" max="1" step="0.1">
                        <div class="tooltip">
                            <h4>Resource Regeneration</h4>
                            <p>How quickly food sources replenish.</p>
                            <ul>
                                <li>Higher values = Abundant resources</li>
                                <li>Lower values = Scarce resources</li>
                                <li>Affects survival strategy</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">How quickly resources replenish (0-1)</span>
                </div>
            </div>

            <div class="form-section">
                <h3>Simulation Speed</h3>
                <div class="form-group">
                    <label for="timeScale">Time Scale:</label>
                    <div class="input-wrapper">
                        <select id="timeScale">
                            <option value="0.25">0.25x - Very Slow</option>
                            <option value="0.5">0.5x - Slow</option>
                            <option value="1">1x - Normal Speed</option>
                            <option value="2">2x - Fast</option>
                            <option value="4">4x - Very Fast</option>
                        </select>
                        <div class="tooltip">
                            <h4>Time Scale</h4>
                            <p>Speed of the simulation.</p>
                            <ul>
                                <li>0.25x = Detailed observation</li>
                                <li>0.5x = Slow motion</li>
                                <li>1x = Normal speed</li>
                                <li>2x = Fast forward</li>
                                <li>4x = Quick results</li>
                            </ul>
                        </div>
                    </div>
                    <span class="form-help">Simulation speed multiplier</span>
                </div>
            </div>

            <div class="form-info">
                <p>Controls:</p>
                <ul>
                    <li>Press <kbd>T</kbd> to toggle movement trails</li>
                    <li>Press <kbd>~</kbd> to toggle debug console</li>
                </ul>
            </div>

            <button type="submit">Start Simulation</button>
        `;
        return form;
    }

    private setupEventListeners() {
        // Toggle console with ~ key
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~') {
                this.toggleConsole();
            }
        });
    }

    public getSimulationParams() {
        const params = {
            initialPopulation: Number((document.getElementById('initialPopulation') as HTMLInputElement)?.value || 10),
            resourceCapacity: Number((document.getElementById('resourceCapacity') as HTMLInputElement)?.value || 50),
            birthRate: Number((document.getElementById('birthRate') as HTMLInputElement)?.value || 0.1),
            timeScale: Number((document.getElementById('timeScale') as HTMLSelectElement)?.value || 1),
            resourceSpots: Number((document.getElementById('resourceSpots') as HTMLInputElement)?.value || 5),
            resourceRegenerationRate: Number((document.getElementById('resourceRegenerationRate') as HTMLInputElement)?.value || 0.1)
        };
        this.lastParams = params;
        return params;
    }

    public hideParameterForm() {
        const form = document.getElementById('parameter-form');
        if (form) {
            form.style.display = 'none';
        }
        // Also hide the container background when starting simulation
        this.container.style.display = 'none';
    }

    public toggleConsole() {
        this.isConsoleVisible = !this.isConsoleVisible;
        this.consoleOverlay.style.display = this.isConsoleVisible ? 'block' : 'none';
    }

    public updateConsole(stats: SimulationStats) {
        this.lastStats = stats;  // Store the latest stats
        if (this.isConsoleVisible) {
            const stateInfo = stats.byState ? 
                Object.entries(stats.byState)
                    .map(([state, count]) => `  ${state.padEnd(10)} : ${count.toString().padStart(3)}`)
                    .join('\n') : '';

            this.consoleOverlay.innerHTML = `
                <pre>
┌─ Population Statistics ───────┐
│ Population : ${stats.population.toString().padStart(4)}        │
│ Tick       : ${stats.tick.toString().padStart(8)}    │
│ Births     : ${stats.births.toString().padStart(4)}        │
│ Deaths     : ${stats.deaths.total.toString().padStart(4)}        │
└────────────────────────────┘

┌─ Death Causes ─────────────┐
│ Starvation : ${stats.deaths.starvation.toString().padStart(4)}        │
│ Old Age    : ${stats.deaths.oldAge.toString().padStart(4)}        │
│ Stress     : ${stats.deaths.stress.toString().padStart(4)}        │
└────────────────────────────┘

┌─ Agent States ──────────────┐
${stateInfo.split('\n').map(line => '│ ' + line.padEnd(26) + ' │').join('\n')}
└────────────────────────────┘

┌─ System Averages ────────────┐
│ Stress     : ${stats.avgStress.toFixed(1).padStart(5)}       │
│ Hunger     : ${stats.avgHunger.toFixed(1).padStart(5)}       │
│ Energy     : ${stats.avgEnergy.toFixed(1).padStart(5)}       │
└────────────────────────────┘

┌─ Resources ─────────────────┐
│ Total      : ${stats.totalResources.toFixed(0).padStart(5)}       │
└────────────────────────────┘</pre>
            `;
        }
    }

    public showRestartButton(onRestart: () => void) {
        // Create a message container
        const messageContainer = document.createElement('div');
        messageContainer.id = 'end-message';
        
        // Get the last stats
        const lastStats = this.lastStats;
        
        let deathAnalysis = '';
        if (lastStats) {
            const { deaths } = lastStats;
            const total = deaths.total;
            const starvationPct = Math.round((deaths.starvation / total) * 100) || 0;
            const oldAgePct = Math.round((deaths.oldAge / total) * 100) || 0;
            const stressPct = Math.round((deaths.stress / total) * 100) || 0;

            deathAnalysis = `
                <div class="death-analysis">
                    <h3>Population Analysis</h3>
                    <p>Total Deaths: ${total}</p>
                    <div class="death-causes">
                        <div class="cause">
                            <span class="label">Starvation:</span>
                            <span class="value">${deaths.starvation} (${starvationPct}%)</span>
                            <div class="bar" style="width: ${starvationPct}%"></div>
                        </div>
                        <div class="cause">
                            <span class="label">Old Age:</span>
                            <span class="value">${deaths.oldAge} (${oldAgePct}%)</span>
                            <div class="bar" style="width: ${oldAgePct}%"></div>
                        </div>
                        <div class="cause">
                            <span class="label">Stress:</span>
                            <span class="value">${deaths.stress} (${stressPct}%)</span>
                            <div class="bar" style="width: ${stressPct}%"></div>
                        </div>
                    </div>
                    <p class="primary-cause">Primary cause: ${this.getPrimaryCause(deaths)}</p>
                </div>
            `;
        }

        messageContainer.innerHTML = `
            <h2>Simulation Ended</h2>
            <p>All agents have died.</p>
            ${deathAnalysis}
        `;
        document.body.appendChild(messageContainer);

        this.restartButton.style.display = 'block';
        this.restartButton.onclick = () => {
            // Remove the message
            messageContainer.remove();
            this.restartButton.style.display = 'none';
            // Reset UI state
            this.resetUI();
            onRestart();
        };
    }

    private resetUI() {
        // Reset form values
        this.resetParameterForm();
        // Show the form
        this.showParameterForm();
        // Hide console if it was visible
        if (this.isConsoleVisible) {
            this.toggleConsole();
        }
        // Reset container background
        this.container.style.display = 'flex';
        // Clear any previous simulation state
        this.lastParams = null;
        this.lastStats = null;
    }

    private resetParameterForm() {
        // Reset all inputs to their default values
        const form = document.getElementById('parameter-form');
        if (form) {
            (form.querySelector('#initialPopulation') as HTMLInputElement).value = '10';
            (form.querySelector('#resourceCapacity') as HTMLInputElement).value = '50';
            (form.querySelector('#birthRate') as HTMLInputElement).value = '0.1';
            (form.querySelector('#timeScale') as HTMLSelectElement).value = '1';
            (form.querySelector('#resourceSpots') as HTMLInputElement).value = '5';
            (form.querySelector('#resourceRegenerationRate') as HTMLInputElement).value = '0.1';
        }
    }

    public showParameterForm() {
        const form = document.getElementById('parameter-form');
        if (form) {
            form.style.display = 'block';
        }
    }

    private getPrimaryCause(deaths: { starvation: number; oldAge: number; stress: number; total: number }): string {
        const causes = [
            { name: 'Starvation', value: deaths.starvation, message: 'Agents couldn\'t find enough food to survive.' },
            { name: 'Old Age', value: deaths.oldAge, message: 'Agents reached their maximum lifespan.' },
            { name: 'Stress', value: deaths.stress, message: 'Overcrowding led to fatal stress levels.' }
        ];

        const primaryCause = causes.reduce((max, current) => 
            current.value > max.value ? current : max
        );

        return primaryCause.message;
    }

    public showLoadingIndicator() {
        this.loadingOverlay.style.display = 'flex';
    }

    public hideLoadingIndicator() {
        this.loadingOverlay.style.display = 'none';
    }

    public showError(message: string) {
        this.errorOverlay.innerHTML = `
            <div class="error-content">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.style.display='none'">Close</button>
            </div>
        `;
        this.errorOverlay.style.display = 'flex';
    }

    public hideError() {
        this.errorOverlay.style.display = 'none';
    }
} 