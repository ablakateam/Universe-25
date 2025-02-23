import { SimulationEngine, SimulationActivity } from './SimulationEngine';

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

type ScarcityLevel = 'Abundant' | 'Sufficient' | 'Limited' | 'Critical';

export class UIController {
    private container: HTMLDivElement;
    private consoleOverlay: HTMLDivElement;
    private restartButton: HTMLButtonElement;
    private loadingOverlay: HTMLDivElement;
    private errorOverlay: HTMLDivElement;
    private simulationContainer: HTMLDivElement;
    private isConsoleVisible: boolean = false;
    private lastParams: SimulationParams | null = null;
    private lastStats: SimulationStats | null = null;
    private updateQueue: Set<string> = new Set();
    private lastUpdateTime: Record<string, number> = {};
    private activityCount: number = 0;
    private readonly MAX_ACTIVITIES = 5;
    private engine: SimulationEngine;
    private activityLog: string[] = [];
    private maxActivityLogSize = 5;

    constructor(engine: SimulationEngine) {
        this.engine = engine;
        
        // Create and initialize all UI elements
        this.container = this.createContainer();
        this.simulationContainer = this.createSimulationContainer();
        this.consoleOverlay = this.createConsoleOverlay();
        this.loadingOverlay = this.createLoadingOverlay();
        this.errorOverlay = this.createErrorOverlay();
        this.restartButton = this.createRestartButton();
        
        // Setup the UI
        this.setupUI();
        this.setupEventListeners();
    }

    private createContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.id = 'ui-container';
        document.body.appendChild(container);
        return container;
    }

    private createSimulationContainer(): HTMLDivElement {
        // Check if container already exists
        let container = document.getElementById('simulation-container') as HTMLDivElement;
        if (!container) {
            container = document.createElement('div');
            container.id = 'simulation-container';
            document.body.appendChild(container);
        }
        return container;
    }

    private createConsoleOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.id = 'console-overlay';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
        return overlay;
    }

    private createLoadingOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>INITIALIZING SIMULATION</h3>
                <p class="loading-subtext">Please wait...</p>
            </div>
        `;
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
        return overlay;
    }

    private createErrorOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.id = 'error-overlay';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
        return overlay;
    }

    private createRestartButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = 'restart-button';
        button.textContent = 'RESTART SIMULATION';
        button.style.display = 'none';
        document.body.appendChild(button);
        return button;
    }

    private setupUI() {
        // Create parameter form
        const form = this.createParameterForm();
        this.container.appendChild(form);

        // Create sidebar
        this.createSidebar();
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

    private createSidebar() {
        // Implementation of createSidebar method
    }

    private setupEventListeners() {
        // Toggle console with ~ key
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~') {
                this.toggleConsole();
            }
        });

        // Add click handler for tooltips
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                target.classList.add('clicked');
                e.stopPropagation(); // Prevent event from bubbling up
            });
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
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        // Generate activity message based on stats changes
        const message = this.generateActivityMessage(stats);
        if (message) {
            this.activityLog.unshift(message);
            if (this.activityLog.length > this.maxActivityLogSize) {
                this.activityLog.pop();
            }

            // Update activity list with animation
            activityList.innerHTML = this.activityLog.map(msg => `
                <div class="activity-item" style="animation: fadeIn 0.3s ease-out">
                    <span class="activity-icon">📝</span>
                    <span class="activity-text">${msg}</span>
                </div>
            `).join('');
        }
    }

    private generateActivityMessage(stats: SimulationStats): string | null {
        const events = [];
        
        if (stats.births > 0) {
            events.push(`${stats.births} new agents born 🐣`);
        }
        if (stats.deaths.total > 0) {
            events.push(`${stats.deaths.total} agents passed away 💫`);
        }
        if (stats.totalResources > 0) {
            events.push(`${Math.floor(stats.totalResources)} resources available 🍎`);
        }

        return events.length > 0 ? events.join(' | ') : null;
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
                <h3>ERROR</h3>
                <p>${message}</p>
                <button onclick="location.reload()">RESTART</button>
            </div>
        `;
        this.errorOverlay.style.display = 'flex';
    }

    public hideError() {
        this.errorOverlay.style.display = 'none';
    }

    public updateStats(stats: SimulationStats) {
        const populationElement = document.getElementById('stat-population');
        const resourcesElement = document.getElementById('stat-resources');
        const tickElement = document.getElementById('stat-tick');

        if (populationElement) {
            populationElement.textContent = `${stats.population} 👥`;
        }
        if (resourcesElement) {
            resourcesElement.textContent = `${stats.totalResources} 🍎`;
        }
        if (tickElement) {
            tickElement.textContent = `${stats.tick} ⏱️`;
        }
    }

    private updateActivityFeed(activities: SimulationActivity[]) {
        const activityFeed = document.querySelector('.activity-feed');
        if (!activityFeed) return;

        const activityList = activityFeed.querySelector('.activity-list');
        if (!activityList) return;

        // Clear existing activities
        while (activityList.firstChild) {
            activityList.removeChild(activityList.firstChild);
        }

        // Add new activities
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const icon = document.createElement('span');
            icon.className = 'activity-icon';
            icon.style.color = this.getColorForActivityType(activity.type);
            icon.textContent = this.getIconForActivityType(activity.type);
            
            const details = document.createElement('div');
            details.className = 'activity-details';
            
            const description = document.createElement('div');
            description.textContent = activity.description;
            
            const time = document.createElement('div');
            time.className = 'activity-time';
            time.textContent = this.formatTimestamp(activity.timestamp);
            
            details.appendChild(description);
            details.appendChild(time);
            
            activityItem.appendChild(icon);
            activityItem.appendChild(details);
            
            // Add with animation
            activityItem.style.opacity = '0';
            activityItem.style.transform = 'translateY(20px)';
            activityList.appendChild(activityItem);
            
            // Trigger animation
            requestAnimationFrame(() => {
                activityItem.style.transition = 'all 0.3s ease-out';
                activityItem.style.opacity = '1';
                activityItem.style.transform = 'translateY(0)';
            });
        });
    }

    private getColorForActivityType(type: string): string {
        const colors: Record<string, string> = {
            'exploring': '#4CAF50',
            'eating': '#FF9800',
            'mating': '#E91E63',
            'resting': '#2196F3',
            'died': '#F44336'
        };
        return colors[type] || '#999999';
    }

    private getIconForActivityType(type: string): string {
        const icons: Record<string, string> = {
            'exploring': '🔍',
            'eating': '🍽️',
            'mating': '❤️',
            'resting': '💤',
            'died': '💀'
        };
        return icons[type] || '❓';
    }

    private formatTimestamp(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        if (diff < 1000) return 'just now';
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
    }

    private updateStatValues(stats: SimulationStats) {
        // Calculate derived statistics
        const growthRate = this.calculateGrowthRate(stats);
        const resourceEfficiency = this.calculateResourceEfficiency(stats);
        const healthIndex = this.calculateHealthIndex(stats);
        const socialIndex = this.calculateSocialIndex(stats);
        const mortalityRate = this.calculateMortalityRate(stats);
        const scarcityLevel = this.determineScarcityLevel(stats);
        const resourcesPerAgent = stats.totalResources / (stats.population || 1);
        const density = (stats.population / (this.lastParams?.resourceCapacity || 100) * 100);

        // Update all elements with new values and status indicators
        this.updateElement('population', stats.population, '👥', this.getStatusForValue(stats.population, 50, 100));
        this.updateElement('births', stats.births, '🐣');
        this.updateElement('deaths', stats.deaths.total, '💀');
        this.updateElement('growth', `${growthRate}%`, '', '', this.getGrowthTrendClass(growthRate));
        
        this.updateElement('resources', stats.totalResources.toFixed(0), '🍎', this.getStatusForValue(stats.totalResources, 50, 100));
        this.updateElement('resourcesPerAgent', resourcesPerAgent.toFixed(1), '📊');
        this.updateElement('resourceEfficiency', `${resourceEfficiency}%`, '⚡', this.getStatusForValue(resourceEfficiency, 30, 70));
        this.updateElement('scarcity', scarcityLevel, this.getScarcityIcon(scarcityLevel), this.getStatusForScarcity(scarcityLevel));
        
        this.updateElement('energy', stats.avgEnergy.toFixed(1), '⚡', this.getStatusForValue(stats.avgEnergy, 30, 70));
        this.updateElement('stress', stats.avgStress.toFixed(1), '😰', this.getStatusForValue(100 - stats.avgStress, 30, 70));
        this.updateElement('hunger', stats.avgHunger.toFixed(1), '🍽️', this.getStatusForValue(100 - stats.avgHunger, 30, 70));
        this.updateElement('healthIndex', `${healthIndex}%`, '❤️', this.getStatusForValue(healthIndex, 30, 70));
        
        this.updateElement('density', `${density.toFixed(0)}%`, '🏘️');
        this.updateElement('interactions', `${stats.population * 2}`, '🤝');
        this.updateElement('territory', `${(100 - density).toFixed(0)}%`, '🗺️');
        this.updateElement('socialIndex', `${socialIndex}%`, '👥', this.getStatusForValue(socialIndex, 30, 70));
        
        this.updateElement('mortalityRate', `${mortalityRate}%`, '📉', this.getStatusForValue(100 - mortalityRate, 30, 70));
        
        // Update death causes
        this.updateDeathCauses(stats);
    }

    private updateElement(id: string, value: string | number, icon: string, status?: string, extraClass?: string) {
        const element = document.getElementById(`stat-${id}`);
        if (!element) return;

        const hasChanged = this.lastUpdateTime[id] && Date.now() - this.lastUpdateTime[id] < 1000;
        const className = `stat-value ${hasChanged ? 'updating' : ''} ${extraClass || ''}`;
        
        element.className = className;
        element.innerHTML = `${value} ${icon ? `<span class="icon">${icon}</span>` : ''}`;
        
        if (status) {
            element.setAttribute('data-status', status);
        }
        
        this.lastUpdateTime[id] = Date.now();
    }

    private getScarcityIcon(level: ScarcityLevel): string {
        const icons: Record<ScarcityLevel, string> = {
            'Abundant': '🌟',
            'Sufficient': '✨',
            'Limited': '⚠️',
            'Critical': '❗'
        };
        return icons[level];
    }

    private getGrowthTrendClass(growthRate: number): string {
        if (growthRate > 0) return 'trend-up';
        if (growthRate < 0) return 'trend-down';
        return 'trend-neutral';
    }

    private calculateGrowthRate(stats: SimulationStats): number {
        const total = stats.births - stats.deaths.total;
        return stats.population > 0 ? Math.round((total / stats.population) * 100) : 0;
    }

    private calculateResourceEfficiency(stats: SimulationStats): number {
        return Math.round((stats.avgEnergy / (stats.totalResources || 1)) * 100);
    }

    private calculateHealthIndex(stats: SimulationStats): number {
        const energyWeight = 0.4;
        const stressWeight = 0.3;
        const hungerWeight = 0.3;

        const normalizedEnergy = stats.avgEnergy / 100;
        const normalizedStress = 1 - (stats.avgStress / 100);
        const normalizedHunger = 1 - (stats.avgHunger / 100);

        return Math.round(
            (normalizedEnergy * energyWeight + 
             normalizedStress * stressWeight + 
             normalizedHunger * hungerWeight) * 100
        );
    }

    private calculateSocialIndex(stats: SimulationStats): number {
        // This is a placeholder calculation - adjust based on your actual social metrics
        const densityFactor = Math.min(stats.population / (this.lastParams?.resourceCapacity || 100), 1);
        return Math.round((1 - densityFactor) * 100);
    }

    private calculateMortalityRate(stats: SimulationStats): number {
        return stats.population > 0 ? 
            Math.round((stats.deaths.total / (stats.population + stats.deaths.total)) * 100) : 0;
    }

    private determineScarcityLevel(stats: SimulationStats): ScarcityLevel {
        const resourcesPerAgent = stats.totalResources / stats.population;
        if (resourcesPerAgent > 2) return 'Abundant';
        if (resourcesPerAgent > 1) return 'Sufficient';
        if (resourcesPerAgent > 0.5) return 'Limited';
        return 'Critical';
    }

    private updateDeathCauses(stats: SimulationStats) {
        const deathCausesElement = document.getElementById('death-causes');
        if (!deathCausesElement) return;

        const causes = [
            { label: 'Starvation', value: stats.deaths.starvation },
            { label: 'Old Age', value: stats.deaths.oldAge },
            { label: 'Stress', value: stats.deaths.stress }
        ];

        const total = stats.deaths.total || 1;
        const primaryCause = this.getPrimaryCause(stats.deaths);

        deathCausesElement.innerHTML = causes.map(cause => `
            <div class="cause ${cause.label === primaryCause ? 'primary-cause' : ''}">
                <div class="cause-header">
                    <span class="label">${cause.label}</span>
                    <span class="value">${cause.value} (${Math.round((cause.value / total) * 100)}%)</span>
                </div>
                <div class="bar-container">
                    <div class="bar" style="width: ${(cause.value / total * 100)}%"></div>
                </div>
            </div>
        `).join('');
    }

    private getStatusForValue(value: number, warningThreshold: number, goodThreshold: number): string {
        if (value >= goodThreshold) return 'good';
        if (value >= warningThreshold) return 'warning';
        return 'critical';
    }

    private getStatusForScarcity(level: ScarcityLevel): string {
        const statusMap: Record<ScarcityLevel, string> = {
            'Abundant': 'good',
            'Sufficient': 'good',
            'Limited': 'warning',
            'Critical': 'critical'
        };
        return statusMap[level];
    }
} 