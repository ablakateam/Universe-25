import p5 from 'p5';
import { Agent, SimulationEngine, Resource, AgentState } from './SimulationEngine';

export class Renderer {
    private p: p5;
    private engine: SimulationEngine;
    private font: p5.Font | null = null;
    private showTrails: boolean = false;
    private trails: Array<{x: number, y: number, age: number}> = [];

    // State-specific symbols and colors
    private stateConfig: Record<AgentState, {symbol: string, color: string}> = {
        exploring: { symbol: '◉', color: '#4AFF83' },  // Brighter green
        eating: { symbol: '★', color: '#FFE837' },     // Brighter yellow
        mating: { symbol: '♥', color: '#FF71B3' },     // Brighter pink
        resting: { symbol: '✤', color: '#C875FF' }     // Brighter purple
    };

    // Add state descriptions at the top of the class
    private stateDescriptions: Record<AgentState, string> = {
        exploring: 'Wandering & searching for resources or mates',
        eating: 'Consuming resources to reduce hunger and gain energy',
        mating: 'Looking for compatible partner to reproduce',
        resting: 'Recovering energy when exhausted'
    };

    constructor(engine: SimulationEngine) {
        this.engine = engine;
        this.setupUI();
        this.p = new p5(this.sketch.bind(this), document.getElementById('simulation-container') || undefined);
    }

    private setupUI() {
        // Create sidebar container
        let sidebar = document.querySelector('.simulation-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.className = 'simulation-sidebar';
            document.body.appendChild(sidebar);

            // Add sidebar header
            const header = document.createElement('div');
            header.className = 'simulation-sidebar-header';
            header.textContent = 'Simulation Controls';
            sidebar.appendChild(header);

            // Create stats container (first)
            let statsContainer = document.createElement('div');
            statsContainer.className = 'simulation-stats';
            sidebar.appendChild(statsContainer);

            // Create agent activity container (second)
            let activityContainer = document.createElement('div');
            activityContainer.className = 'agent-activity';
            sidebar.appendChild(activityContainer);

            // Create state info container (third)
            let stateInfoContainer = document.createElement('div');
            stateInfoContainer.className = 'state-info';
            sidebar.appendChild(stateInfoContainer);

            // Create legend container (fourth)
            let legendContainer = document.createElement('div');
            legendContainer.className = 'legend';
            sidebar.appendChild(legendContainer);
        }

        // Create toggle button with enhanced styling
        let toggleButton = document.querySelector('.sidebar-toggle');
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.className = 'sidebar-toggle';
            toggleButton.innerHTML = '◀';
            const sidebarElement = sidebar;
            toggleButton.addEventListener('click', () => {
                if (sidebarElement && toggleButton) {
                    sidebarElement.classList.toggle('collapsed');
                    toggleButton.classList.toggle('collapsed');
                    toggleButton.innerHTML = sidebarElement.classList.contains('collapsed') ? '▶' : '◀';
                }
            });
            document.body.appendChild(toggleButton);
        }
    }

    private sketch(p: p5) {
        this.p = p;

        p.preload = () => {
            // Load a monospace font for better ASCII rendering
            this.font = p.loadFont('https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@4.5.10/files/roboto-mono-latin-400-normal.woff');
        };

        p.setup = () => {
            const container = document.getElementById('simulation-container');
            if (!container) {
                console.error('Simulation container not found');
                return;
            }

            // Create canvas with container dimensions
            const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
            canvas.parent(container);
            
            // Set initial styles
            p.textFont('monospace');
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            
            console.log('Canvas created:', p.width, p.height);
        };

        p.draw = () => {
            p.background(20); // Dark background

            // Draw trails if enabled
            if (this.showTrails) {
                this.drawTrails();
            }

            // Draw resources
            this.drawResources();

            // Draw all agents
            const agents = this.engine.getAgents();
            console.log('Drawing agents:', agents.length); // Debug log
            agents.forEach(agent => this.drawAgent(agent));

            // Draw stats
            this.drawStats();

            // Update trails
            if (this.showTrails) {
                this.updateTrails(agents);
            }
        };

        p.windowResized = () => {
            const container = document.getElementById('simulation-container');
            if (container) {
                p.resizeCanvas(container.clientWidth, container.clientHeight);
            }
        };

        // Toggle trails with 'T' key
        p.keyPressed = () => {
            if (p.key.toLowerCase() === 't') {
                this.showTrails = !this.showTrails;
                if (!this.showTrails) {
                    this.trails = [];
                }
            }
        };
    }

    private drawAgent(agent: Agent) {
        const stateStyle = this.stateConfig[agent.state];
        
        this.p.push();
        
        // Enhanced outer glow effect
        this.p.noStroke();
        for (let i = 4; i > 0; i--) {
            const alpha = 60 / i;  // Increased alpha for better visibility
            this.p.fill(stateStyle.color + alpha.toString(16).padStart(2, '0'));
            this.p.ellipse(agent.x, agent.y, 65 - (i * 5), 65 - (i * 5));  // Increased size
        }
        
        // Brighter outer ring with pulse effect for newborns
        this.p.stroke(stateStyle.color);
        this.p.strokeWeight(3);
        this.p.noFill();
        if (agent.birthTick && this.p.frameCount - agent.birthTick < 60) {
            const pulseSize = 40 + Math.sin(this.p.frameCount * 0.2) * 10;
            this.p.ellipse(agent.x, agent.y, pulseSize, pulseSize);
        } else {
            this.p.ellipse(agent.x, agent.y, 40, 40);
        }

        // Draw movement trail
        if (agent.targetX !== null && agent.targetY !== null) {
            // Enhanced glowing line effect
            for (let i = 3; i > 0; i--) {
                this.p.stroke(stateStyle.color + (40 * i).toString(16));
                this.p.strokeWeight(i * 1.5);
                
                // Draw dashed line
                const segments = 10;
                for (let j = 0; j < segments; j++) {
                    if (j % 2 === 0) {
                        const x1 = this.p.lerp(agent.x, agent.targetX, j / segments);
                        const y1 = this.p.lerp(agent.y, agent.targetY, j / segments);
                        const x2 = this.p.lerp(agent.x, agent.targetX, (j + 1) / segments);
                        const y2 = this.p.lerp(agent.y, agent.targetY, (j + 1) / segments);
                        this.p.line(x1, y1, x2, y2);
                    }
                }
            }
            
            // Animated target indicator
            this.p.push();
            this.p.translate(agent.targetX, agent.targetY);
            this.p.rotate(this.p.frameCount * 0.05);
            for (let i = 0; i < 4; i++) {
                this.p.rotate(this.p.PI / 2);
                this.p.line(0, 15, 0, 20);
            }
            this.p.pop();
        }

        // Draw agent symbol with enhanced visibility
        this.p.textSize(32);
        
        // Enhanced glow effect for the symbol
        for (let i = 5; i > 0; i--) {  // Increased glow layers
            this.p.stroke(stateStyle.color + '40');
            this.p.strokeWeight(i * 2);
            this.p.fill(stateStyle.color + '40');
            this.p.text(stateStyle.symbol, agent.x, agent.y + 2);
        }
        
        // Main symbol with stronger color
        this.p.stroke(stateStyle.color);
        this.p.strokeWeight(2);
        this.p.fill(stateStyle.color);
        this.p.text(stateStyle.symbol, agent.x, agent.y);

        // Draw status bars with enhanced visibility
        this.drawStatusBars(agent);

        // Draw agent ID with better visibility
        this.drawAgentId(agent);

        this.p.pop();
    }

    private drawStatusBars(agent: Agent) {
        const barWidth = 30;
        const barHeight = 6;
        const barY = agent.y - 25;
        
        // Energy bar
        this.drawBar(
            agent.x - barWidth/2,
            barY,
            barWidth,
            barHeight,
            agent.energy / 100,
            '#00FF00'
        );
        
        // Hunger bar
        this.drawBar(
            agent.x - barWidth/2,
            barY - 8,
            barWidth,
            barHeight,
            agent.hunger / 100,
            '#FF3333'
        );
    }

    private drawBar(x: number, y: number, width: number, height: number, value: number, color: string) {
        // Bar background with glow
        this.p.fill(0, 0, 0, 200);
        this.p.noStroke();
        this.p.rect(x, y, width, height, 2);
        
        // Bar with glow
        this.p.fill(color + '40');
        this.p.rect(x - 1, y - 1, (value * width) + 2, height + 2, 2);
        this.p.fill(color);
        this.p.rect(x, y, value * width, height, 2);
    }

    private drawAgentId(agent: Agent) {
        // Enhanced ID tag with glow effect
        this.p.noStroke();
        // Glow
        this.p.fill(0, 0, 0, 180);
        this.p.rect(agent.x - 16, agent.y + 14, 32, 17, 5);
        // Main background
        this.p.fill(0, 0, 0, 230);
        this.p.rect(agent.x - 15, agent.y + 15, 30, 15, 5);
        // Text
        this.p.fill(255);
        this.p.textSize(12);
        this.p.text(`#${agent.id}`, agent.x, agent.y + 22);
    }

    private drawResources() {
        const resources = this.engine.getResources();
        
        resources.forEach(resource => {
            this.p.push();
            
            // Outer glow
            const radius = 30 * (resource.amount / resource.maxAmount);
            const alpha = 100 + (155 * resource.amount / resource.maxAmount);
            
            // Multiple layers for better visibility
            for (let i = 3; i > 0; i--) {
                this.p.noStroke();
                this.p.fill(0, 255, 255, (alpha / i) * 0.2);
                this.p.ellipse(resource.x, resource.y, radius * i, radius * i);
            }
            
            // Center circle
            this.p.fill(0, 255, 255, alpha);
            this.p.stroke(0, 255, 255);
            this.p.strokeWeight(2);
            this.p.ellipse(resource.x, resource.y, 20, 20);
            
            // Resource symbol
            this.p.fill(0);
            this.p.noStroke();
            this.p.textSize(16);
            this.p.text('✦', resource.x, resource.y);
            
            this.p.pop();
        });
    }

    private updateTrails(agents: Agent[]) {
        // Add new trail points
        agents.forEach(agent => {
            this.trails.push({
                x: agent.x,
                y: agent.y,
                age: 0
            });
        });

        // Age and remove old trails
        this.trails = this.trails
            .map(trail => ({ ...trail, age: trail.age + 1 }))
            .filter(trail => trail.age < 50);
    }

    private drawTrails() {
        this.p.push();
        this.trails.forEach(trail => {
            const alpha = Math.max(0, 255 - (trail.age * 5));
            this.p.fill(255, 255, 255, alpha);
            this.p.noStroke();
            this.p.ellipse(trail.x, trail.y, 2, 2);
        });
        this.p.pop();
    }

    private drawStats() {
        const stats = this.engine.getStats();
        const agents = this.engine.getAgents();
        
        // Update stats content
        const statsContainer = document.querySelector('.simulation-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <h3>Simulation Stats</h3>
                <div class="stat-group">
                    <div>
                        <span class="stat-label">Population:</span>
                        <span class="stat-value">${stats.population}</span>
                    </div>
                    <div>
                        <span class="stat-label">Tick:</span>
                        <span class="stat-value">${stats.tick}</span>
                    </div>
                    <div>
                        <span class="stat-label">Births:</span>
                        <span class="stat-value">${stats.births}</span>
                    </div>
                    <div>
                        <span class="stat-label">Deaths:</span>
                        <span class="stat-value">${stats.deaths.total}</span>
                    </div>
                </div>
                <div class="stat-group">
                    <div>
                        <span class="stat-label">Resources:</span>
                        <span class="stat-value">${stats.totalResources.toFixed(0)}</span>
                    </div>
                </div>
            `;
        }

        // Update agent activity content
        const activityContainer = document.querySelector('.agent-activity');
        if (activityContainer) {
            // Get the 5 most recent activities
            const recentActivities = agents
                .slice(-5)
                .map(agent => {
                    const stateConfig = this.stateConfig[agent.state];
                    let activityText = '';
                    switch(agent.state) {
                        case 'exploring':
                            activityText = 'Searching for resources or mates';
                            break;
                        case 'eating':
                            activityText = `Consuming resources (Energy: ${agent.energy.toFixed(0)}%)`;
                            break;
                        case 'mating':
                            activityText = 'Looking for a mate';
                            break;
                        case 'resting':
                            activityText = `Recovering energy (${agent.energy.toFixed(0)}%)`;
                            break;
                    }
                    return `
                        <div class="activity-item">
                            <span class="activity-icon" style="color: ${stateConfig.color}">${stateConfig.symbol}</span>
                            <div class="activity-details">
                                <div>${activityText}</div>
                                <div class="activity-agent-id">Agent #${agent.id}</div>
                            </div>
                        </div>
                    `;
                })
                .reverse()
                .join('');

            activityContainer.innerHTML = `
                <h3>Recent Agent Activities</h3>
                <div class="activity-list">
                    ${recentActivities || '<div class="activity-item">No recent activities</div>'}
                </div>
            `;
        }

        // Update state info content
        const stateInfoContainer = document.querySelector('.state-info');
        if (stateInfoContainer) {
            stateInfoContainer.innerHTML = `
                <h3>State Descriptions</h3>
                <div class="state-descriptions">
                    ${Object.entries(this.stateConfig).map(([stateKey, config]) => {
                        const state = stateKey as AgentState;
                        const count = stats.byState[state] || 0;
                        const percentage = stats.population > 0 
                            ? Math.round((count / stats.population) * 100)
                            : 0;
                        
                        return `
                            <div class="state-description-item">
                                <div class="state-header">
                                    <span class="state-symbol" style="color: ${config.color}">${config.symbol}</span>
                                    <span class="state-name">${state}</span>
                                </div>
                                <p class="state-detail">${this.stateDescriptions[state]}</p>
                                <div class="state-stats">
                                    <span class="state-count">Count: ${count}</span>
                                    <span class="state-percentage">${percentage}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="simulation-metrics">
                    <h4>Key Metrics</h4>
                    <div class="metric">
                        <span class="metric-label">Average Energy:</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${stats.avgEnergy}%; background: #00ff00;"></div>
                        </div>
                        <span class="metric-value">${stats.avgEnergy.toFixed(1)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Average Hunger:</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${stats.avgHunger}%; background: #ff4444;"></div>
                        </div>
                        <span class="metric-value">${stats.avgHunger.toFixed(1)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Average Stress:</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${stats.avgStress}%; background: #ff00ff;"></div>
                        </div>
                        <span class="metric-value">${stats.avgStress.toFixed(1)}</span>
                    </div>
                </div>
            `;
        }

        // Update legend content
        const legendContainer = document.querySelector('.legend');
        if (legendContainer) {
            legendContainer.innerHTML = `
                <h3>Agent States</h3>
                ${Object.entries(this.stateConfig).map(([state, config]) => `
                    <div class="legend-item">
                        <span class="legend-symbol" style="color: ${config.color}">${config.symbol}</span>
                        <span class="legend-label">${state}</span>
                    </div>
                `).join('')}
                <div class="legend-item">
                    <span class="legend-label">Press T to toggle trails</span>
                </div>
            `;
        }
    }
} 