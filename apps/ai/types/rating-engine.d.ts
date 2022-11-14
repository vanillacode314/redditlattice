import { Agent, JSONEncodedAgent } from './nn/agent';
export declare class RatingEngine {
    agent: Agent;
    constructor({ agent }?: {
        agent?: Agent;
    });
    predict(subreddit: number, searchTerm: number): readonly [boolean, readonly [number, number]];
    mutate(p: number): RatingEngine;
    crossover(other: RatingEngine): RatingEngine;
    clone(): RatingEngine;
    toObject(): JSONEncodedAgent;
    toJson(): string;
    toFunction(): (subreddit: number, searchTerm: number) => readonly [boolean, [number, number]];
    static fromObject(agent: JSONEncodedAgent): RatingEngine;
    static fromJson(json: string): RatingEngine;
}
export declare const bestEngine: () => RatingEngine;
export declare const savePopulation: () => string;
export declare const loadPopulation: (json: string) => RatingEngine[];
export declare const initializePopulation: (engine: RatingEngine) => void;
export declare function trainRatingEngine(input: readonly [number, number], goodPair: boolean): RatingEngine;
