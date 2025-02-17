import { RandomSeeder } from './RandomSeeder';

export interface Resource {
    x: number;
    y: number;
    amount: number;
    maxAmount: number;
    regenerationRate: number;
}

export type AgentState = 'exploring' | 'eating' | 'mating' | 'resting';

export interface Agent {
    id: number;
    x: number;
    y: number;
    age: number;
    hunger: number;
    energy: number;
    state: AgentState;
    symbol: string;
    color: string;
    targetX: number | null;
    targetY: number | null;
    stressLevel: number;
    socialConnections: Set<number>;  // IDs of other agents this one has interacted with
    birthTick?: number;  // Track when agent was born
    parentIds?: [number, number];  // Track parent IDs
    sex: 'male' | 'female';  // Add sex property
    directionX: number;  // Add movement direction
    directionY: number;
}

export interface SimulationParams {
    initialPopulation: number;
    resourceCapacity: number;
    birthRate: number;
    timeScale: number;
    resourceSpots: number;
    resourceRegenerationRate: number;
}

export interface DeathStats {
    starvation: number;
    oldAge: number;
    stress: number;
    total: number;
}

export class SimulationEngine {
    private agents: Agent[] = [];
    private resources: Resource[] = [];
    private tick: number = 0;
    private params: SimulationParams;
    private nextId: number = 0;
    private deathStats: DeathStats = {
        starvation: 0,
        oldAge: 0,
        stress: 0,
        total: 0
    };
    private seeder: RandomSeeder;

    constructor(params: SimulationParams) {
        this.params = {
            ...params,
            resourceSpots: params.resourceSpots || 5,
            resourceRegenerationRate: params.resourceRegenerationRate || 0.1
        };
        this.seeder = new RandomSeeder();
        this.initializeEnvironment();
    }

    private async initializeEnvironment() {
        // Fetch current temperature
        try {
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m');
            const data = await response.json();
            const temperature = data.current.temperature_2m;
            this.seeder.setTemperature(temperature);
        } catch (error) {
            console.warn('Could not fetch temperature, using time-based seed only:', error);
        }

        this.initializeResources();
        this.initializeAgents();
    }

    private initializeResources() {
        for (let i = 0; i < this.params.resourceSpots; i++) {
            const position = this.seeder.getRandomPosition();
            this.resources.push({
                x: position.x,
                y: position.y,
                amount: this.params.resourceCapacity / this.params.resourceSpots,
                maxAmount: this.params.resourceCapacity / this.params.resourceSpots,
                regenerationRate: this.params.resourceRegenerationRate
            });
        }
    }

    private initializeAgents() {
        for (let i = 0; i < this.params.initialPopulation; i++) {
            this.createAgent();
        }
    }

    private createAgent(parentA?: Agent, parentB?: Agent): Agent {
        let position;
        if (parentA && parentB) {
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;
            position = {
                x: (parentA.x + parentB.x) / 2 + offsetX,
                y: (parentA.y + parentB.y) / 2 + offsetY
            };
        } else {
            position = this.seeder.getRandomPosition();
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = parentA && parentB ? 2 : 1;

        const agent: Agent = {
            id: this.nextId++,
            x: position.x,
            y: position.y,
            age: 0,
            hunger: 50,
            energy: 100,
            state: 'exploring',
            symbol: '@',
            color: '#4CAF50',
            targetX: null,
            targetY: null,
            stressLevel: 0,
            socialConnections: new Set(),
            birthTick: this.tick,
            parentIds: parentA && parentB ? [parentA.id, parentB.id] : undefined,
            sex: Math.random() < 0.5 ? 'male' : 'female',
            directionX: Math.cos(angle) * speed,
            directionY: Math.sin(angle) * speed
        };

        agent.symbol = agent.sex === 'male' ? '♂' : '♀';
        agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';

        console.log(`New agent #${agent.id} (${agent.sex}) created at position:`, {
            x: position.x.toFixed(2),
            y: position.y.toFixed(2),
            parents: parentA && parentB ? `${parentA.id} & ${parentB.id}` : 'none'
        });

        if (parentA && parentB) {
            const nearestResource = this.findNearestResource(agent);
            if (nearestResource) {
                agent.state = 'eating';
                agent.targetX = nearestResource.x;
                agent.targetY = nearestResource.y;
            }
            console.log(`New agent ${agent.id} (${agent.sex}) created at position:`, position);
        }

        this.agents.push(agent);
        return agent;
    }

    private moveTowardsTarget(agent: Agent) {
        if (agent.targetX === null || agent.targetY === null) return;

        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 2) {
            agent.targetX = null;
            agent.targetY = null;
            return;
        }

        const speed = 2;
        agent.x += (dx / distance) * speed;
        agent.y += (dy / distance) * speed;
    }

    private findNearestResource(agent: Agent): Resource | null {
        return this.resources
            .filter(r => r.amount > 0)
            .reduce((nearest, resource) => {
                const distance = Math.sqrt(
                    Math.pow(resource.x - agent.x, 2) + 
                    Math.pow(resource.y - agent.y, 2)
                );
                if (!nearest || distance < nearest.distance) {
                    return { resource, distance };
                }
                return nearest;
            }, null as { resource: Resource, distance: number } | null)
            ?.resource || null;
    }

    private updateAgentState(agent: Agent) {
        const nearbyAgents = this.agents.filter(other => 
            other.id !== agent.id && 
            Math.sqrt(Math.pow(other.x - agent.x, 2) + Math.pow(other.y - agent.y, 2)) < 50
        );
        
        agent.stressLevel = Math.min(100, agent.stressLevel + (nearbyAgents.length * 0.01));
        
        if (agent.birthTick && this.tick - agent.birthTick < 60) {
            agent.color = `hsl(${(this.tick - agent.birthTick) * 6}, 100%, 70%)`;
            return;
        }

        if (agent.birthTick && this.tick - agent.birthTick === 60) {
            agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';
        }

        switch(agent.state) {
            case 'exploring':
                if (agent.hunger > 70) {
                    const resource = this.findNearestResource(agent);
                    if (resource) {
                        agent.state = 'eating';
                        agent.targetX = resource.x;
                        agent.targetY = resource.y;
                        agent.color = '#FFE837';
                    }
                } else if (agent.energy < 20) {
                    agent.state = 'resting';
                    agent.color = '#C875FF';
                } else if (agent.hunger < 50 && agent.energy > 50) {
                    agent.state = 'mating';
                    agent.color = '#FF71B3';
                }
                break;
                
            case 'eating':
                const resource = this.findNearestResource(agent);
                if (resource && Math.sqrt(
                    Math.pow(resource.x - agent.x, 2) + 
                    Math.pow(resource.y - agent.y, 2)) < 5) {
                    const consumed = Math.min(resource.amount, 20);
                    resource.amount -= consumed;
                    agent.hunger = Math.max(0, agent.hunger - consumed);
                    agent.energy = Math.min(100, agent.energy + consumed * 0.8);
                    
                    if (agent.hunger < 30) {
                        agent.state = 'exploring';
                        agent.targetX = null;
                        agent.targetY = null;
                        agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';
                    }
                }
                break;
                
            case 'resting':
                agent.energy += 3;
                if (agent.energy > 80) {
                    agent.state = 'exploring';
                    agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';
                }
                break;
                
            case 'mating':
                // Mating logic is handled in checkMatingCollisions
                break;
        }
    }

    private updateAgentMovement(agent: Agent, timeScale: number) {
        if (agent.state === 'resting') return;

        if (agent.targetX !== null && agent.targetY !== null) {
            const dx = agent.targetX - agent.x;
            const dy = agent.targetY - agent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
                agent.targetX = null;
                agent.targetY = null;
                return;
            }

            const baseSpeed = agent.state === 'eating' ? 3 : 2;
            const speed = baseSpeed * timeScale;
            agent.x += (dx / distance) * speed;
            agent.y += (dy / distance) * speed;
        } else {
            if (Math.random() < 0.05 * timeScale) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (0.5 + Math.random() * 0.5) * timeScale;
                agent.directionX = Math.cos(angle) * speed;
                agent.directionY = Math.sin(angle) * speed;
            }

            agent.x += (agent.directionX + (Math.random() - 0.5) * 0.2) * timeScale;
            agent.y += (agent.directionY + (Math.random() - 0.5) * 0.2) * timeScale;

            if (agent.x <= 0 || agent.x >= window.innerWidth) {
                agent.directionX *= -1;
                agent.directionX += (Math.random() - 0.5) * 0.2 * timeScale;
                agent.x = Math.max(0, Math.min(window.innerWidth, agent.x));
            }
            if (agent.y <= 0 || agent.y >= window.innerHeight) {
                agent.directionY *= -1;
                agent.directionY += (Math.random() - 0.5) * 0.2 * timeScale;
                agent.y = Math.max(0, Math.min(window.innerHeight, agent.y));
            }
        }
    }

    private checkMatingCollisions(agent: Agent) {
        if (agent.state !== 'mating') return;

        const potentialMates = this.agents.filter(other => 
            other.id !== agent.id &&
            other.state === 'mating' &&
            other.sex !== agent.sex &&
            other.energy > 30 &&
            Math.sqrt(Math.pow(other.x - agent.x, 2) + Math.pow(other.y - agent.y, 2)) < 30
        );

        for (const potentialMate of potentialMates) {
            if (Math.random() < this.params.birthRate) {
                console.log(`Mating successful between ${agent.sex} #${agent.id} and ${potentialMate.sex} #${potentialMate.id}`);
                
                const newAgent = this.createAgent(agent, potentialMate);
                
                agent.state = 'exploring';
                agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';
                potentialMate.state = 'exploring';
                potentialMate.color = potentialMate.sex === 'male' ? '#4444FF' : '#FF4444';
                
                agent.socialConnections.add(potentialMate.id);
                potentialMate.socialConnections.add(agent.id);
                agent.socialConnections.add(newAgent.id);
                potentialMate.socialConnections.add(newAgent.id);

                const energyCost = 10 * this.params.timeScale;
                agent.energy = Math.max(0, agent.energy - energyCost);
                potentialMate.energy = Math.max(0, potentialMate.energy - energyCost);

                const nearestResourceForParent = this.findNearestResource(agent);
                if (nearestResourceForParent) {
                    agent.state = 'eating';
                    agent.targetX = nearestResourceForParent.x;
                    agent.targetY = nearestResourceForParent.y;
                }

                const nearestResourceForMate = this.findNearestResource(potentialMate);
                if (nearestResourceForMate) {
                    potentialMate.state = 'eating';
                    potentialMate.targetX = nearestResourceForMate.x;
                    potentialMate.targetY = nearestResourceForMate.y;
                }

                break;
            }
        }

        if (Math.random() < 0.005 * this.params.timeScale) {
            agent.state = 'exploring';
            agent.color = agent.sex === 'male' ? '#4444FF' : '#FF4444';
        }
    }

    update() {
        this.tick++;
        
        const updateStep = this.params.timeScale;
        
        this.resources.forEach(resource => {
            resource.amount = Math.min(
                resource.maxAmount,
                resource.amount + (resource.regenerationRate * 3 * updateStep)
            );
        });
        
        this.agents.forEach(agent => {
            agent.age += updateStep;
            agent.hunger += 0.2 * updateStep;
            agent.energy = Math.max(0, agent.energy - (0.08 * updateStep));
            
            this.updateAgentState(agent);
            this.updateAgentMovement(agent, updateStep);
            this.checkMatingCollisions(agent);
            
            const resource = this.findNearestResource(agent);
            if (resource && Math.sqrt(
                Math.pow(resource.x - agent.x, 2) + 
                Math.pow(resource.y - agent.y, 2)) < 5) {
                const consumed = Math.min(resource.amount, 15 * updateStep);
                resource.amount -= consumed;
                agent.hunger = Math.max(0, agent.hunger - consumed);
                agent.energy = Math.min(100, agent.energy + consumed * 0.8);
            }
            
            if (agent.stressLevel > 0) {
                agent.stressLevel = Math.max(0, agent.stressLevel - (0.2 * updateStep));
            }
        });

        const deadAgents = this.agents.filter(agent => 
            agent.age >= 2000 ||
            agent.hunger >= 100 || 
            agent.stressLevel >= 100
        );

        deadAgents.forEach(agent => {
            if (agent.hunger >= 100) this.deathStats.starvation++;
            if (agent.age >= 2000) this.deathStats.oldAge++;
            if (agent.stressLevel >= 100) this.deathStats.stress++;
        });

        this.agents = this.agents.filter(agent => 
            agent.age < 2000 && 
            agent.hunger < 100 && 
            agent.stressLevel < 100
        );

        this.deathStats.total = this.nextId - this.agents.length;
    }

    getAgents(): Agent[] {
        return this.agents;
    }

    getResources(): Resource[] {
        return this.resources;
    }

    getStats() {
        const stateCount = this.agents.reduce((acc, agent) => {
            acc[agent.state] = (acc[agent.state] || 0) + 1;
            return acc;
        }, {} as Record<AgentState, number>);

        const avgStress = this.agents.reduce((sum, agent) => sum + agent.stressLevel, 0) / (this.agents.length || 1);
        const avgHunger = this.agents.reduce((sum, agent) => sum + agent.hunger, 0) / (this.agents.length || 1);
        const avgEnergy = this.agents.reduce((sum, agent) => sum + agent.energy, 0) / (this.agents.length || 1);

        return {
            population: this.agents.length,
            tick: this.tick,
            births: this.nextId,
            deaths: this.deathStats,
            byState: stateCount,
            avgStress,
            avgHunger,
            avgEnergy,
            totalResources: this.resources.reduce((sum, r) => sum + r.amount, 0)
        };
    }

    public getDebugInfo() {
        return {
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            agentCount: this.agents.length,
            agentPositions: this.agents.map(a => ({id: a.id, x: a.x, y: a.y}))
        };
    }
} 