import { JSONEncodedNetwork, Network } from '.';
export interface JSONEncodedAgent {
    brain: JSONEncodedNetwork;
    fitness: number;
}
export declare class Agent {
    brain: Network;
    fitness: number;
    constructor({ brain, fitness, }?: {
        brain?: Network;
        fitness?: number;
    });
    clone(): Agent;
    reward(n: number): this;
    punish(n: number): this;
    mutate(p: number): this;
    crossover(other: Agent): Agent;
    toObject(): JSONEncodedAgent;
    toJson(): string;
    static fromObject({ fitness, brain }: JSONEncodedAgent): Agent;
    static fromJson(json: string): Agent;
}
