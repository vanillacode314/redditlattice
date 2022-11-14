declare type WeightedItem<T = unknown> = [T, number];
export declare function chooseFromWeighted<T>(items: Array<WeightedItem<T>>): WeightedItem<T>[0];
export declare function randn_bm(): number;
export declare function getItems<T = unknown>(arr: T[], id: number): T[];
export declare function genPermutationNumber(arr: unknown[]): number;
export {};
