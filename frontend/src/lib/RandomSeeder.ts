export class RandomSeeder {
    private seed: number;
    private temperature: number = 20; // Default temperature in Celsius

    constructor() {
        // Use current time as initial seed
        this.seed = Date.now();
    }

    public setTemperature(temp: number) {
        this.temperature = temp;
        // Update seed based on temperature
        this.seed = this.seed * (1 + (this.temperature / 100));
    }

    private random() {
        // Simple random number generator using the seed
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    public getRandomPosition() {
        // Get window dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Add some padding to keep agents away from edges
        const padding = 50;

        return {
            x: padding + (width - 2 * padding) * this.random(),
            y: padding + (height - 2 * padding) * this.random()
        };
    }
} 