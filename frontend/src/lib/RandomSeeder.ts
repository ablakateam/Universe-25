export class RandomSeeder {
    private seed: number;
    
    constructor() {
        // Initialize with current time components
        const now = new Date();
        const timeComponent = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const dateComponent = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        
        // Combine components into a seed
        this.seed = timeComponent * dateComponent;
    }

    // Set temperature data
    public setTemperature(temperature: number) {
        // Combine temperature with existing seed
        this.seed = this.seed * Math.abs(temperature * 100);
    }

    // Mulberry32 algorithm for seeded random number generation
    private random(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Get random number within a range
    public getRandomInRange(min: number, max: number): number {
        return min + (max - min) * this.random();
    }

    // Get random position within window bounds with padding
    public getRandomPosition(padding: number = 50): { x: number; y: number } {
        return {
            x: this.getRandomInRange(padding, window.innerWidth - padding),
            y: this.getRandomInRange(padding, window.innerHeight - padding)
        };
    }
} 