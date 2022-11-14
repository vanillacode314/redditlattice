declare class Connection {
    from: Neuron;
    to: Neuron;
    weight: number;
    constructor(from: Neuron, to: Neuron, { weight }?: {
        weight?: number;
    });
    toObject(): {
        from: Neuron['id'];
        to: Neuron['id'];
        weight: number;
    };
}
interface NeuronOptions {
    id: string;
    weightRange: [number, number];
    biasRange: [number, number];
    weights: number[];
    bias: number;
}
interface JSONEncodedNeuron {
    id: Neuron['id'];
    bias: Neuron['bias'];
    biasRange: Neuron['biasRange'];
    weightRange: Neuron['weightRange'];
    weights: Neuron['weights'];
}
export declare class Neuron {
    id: string;
    bias: number;
    weights: number[];
    connections: Connection[];
    weightRange: [number, number];
    biasRange: [number, number];
    constructor({ id, weights, bias, weightRange, biasRange, }?: Partial<NeuronOptions>);
    activate(input: number): number[];
    connect(other: Neuron, weight?: number): Neuron;
    setWeights(val: number[]): this;
    clone(): Neuron;
    toObject(): JSONEncodedNeuron;
    static fromObject({ id, weights, bias, biasRange, weightRange, }: JSONEncodedNeuron): Neuron;
}
declare type LayerOptions = Xor<{
    size: number;
    weightRange?: [number, number];
    biasRange?: [number, number];
}, {
    neurons: Neuron[];
    weightRange?: [number, number];
    biasRange?: [number, number];
}>;
interface JSONEncodedLayer {
    neurons: Neuron['id'][];
}
export declare class Layer {
    neurons: Neuron[];
    constructor({ size, neurons, biasRange, weightRange }: LayerOptions);
    activate(input: number[]): number[];
    setNeurons(neurons: Neuron[]): this;
    connect(other: Layer): Layer;
    clone(): Layer;
    toObject(): JSONEncodedLayer;
    static fromObject({ neurons }: JSONEncodedLayer, neuronsMap: Record<Neuron['id'], Neuron>): Layer;
}
interface NetworkOptions {
    inputLayer: Layer;
    hiddenLayers: Layer[];
    outputLayer: Layer;
    weightRange?: [number, number];
    biasRange?: [number, number];
}
export interface JSONEncodedNetwork {
    shape: {
        inputLayer: ReturnType<Layer['toObject']>;
        hiddenLayers: ReturnType<Layer['toObject']>[];
        outputLayer: ReturnType<Layer['toObject']>;
    };
    neurons: Record<Neuron['id'], ReturnType<Neuron['toObject']>>;
}
export declare class Network {
    inputLayer: Layer;
    hiddenLayers: Layer[];
    outputLayer: Layer;
    constructor({ inputLayer, hiddenLayers, outputLayer }: NetworkOptions);
    activate(input: number[]): number[];
    clone(): Network;
    get neurons(): Neuron[];
    toObject(): JSONEncodedNetwork;
    toJson(): string;
    static fromObject({ neurons, shape }: JSONEncodedNetwork): Network;
    static fromJson(json: string): Network;
}
export declare function createPerceptron(input: number, hidden: number[], output: number, { weightRange, biasRange, }?: {
    weightRange?: [number, number];
    biasRange?: [number, number];
}): Network;
export {};
