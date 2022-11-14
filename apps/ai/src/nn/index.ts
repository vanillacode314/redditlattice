import { sum } from 'lodash-es'
import { transpose } from './matrix'

function randrange(start: number, end: number) {
  const size = end - start
  return Math.random() * size + start
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.pow(Math.E, -x))
}

class Connection {
  from: Neuron
  to: Neuron
  weight: number

  constructor(from: Neuron, to: Neuron, { weight }: { weight?: number } = {}) {
    this.from = from
    this.to = to
    this.weight = weight ?? Math.random()
  }

  toObject(): { from: Neuron['id']; to: Neuron['id']; weight: number } {
    return {
      from: this.from.id,
      to: this.to.id,
      weight: this.weight,
    }
  }
}

interface NeuronOptions {
  id: string
  weightRange: [number, number]
  biasRange: [number, number]
  weights: number[]
  bias: number
}

interface JSONEncodedNeuron {
  id: Neuron['id']
  bias: Neuron['bias']
  biasRange: Neuron['biasRange']
  weightRange: Neuron['weightRange']
  weights: Neuron['weights']
}

export class Neuron {
  id: string
  bias: number
  weights: number[]
  connections: Connection[]
  weightRange: [number, number]
  biasRange: [number, number]

  constructor({
    id,
    weights,
    bias,
    weightRange = [-10, 10],
    biasRange = [-1, 1],
  }: Partial<NeuronOptions> = {}) {
    this.id = id || crypto.randomUUID()
    this.weightRange = weightRange
    this.biasRange = biasRange
    this.bias = bias ?? randrange(...biasRange)
    this.weights = weights || []
    this.connections = []
  }

  activate(input: number): number[] {
    return this.connections.map((conn) => conn.weight * input - this.bias)
  }

  connect(other: Neuron, weight?: number): Neuron {
    if (this.weights[this.connections.length] === undefined) {
      weight = weight || randrange(...this.weightRange)
      this.weights.push(weight)
    }
    this.connections.push(
      new Connection(this, other, {
        weight: this.weights[this.connections.length],
      })
    )
    return this
  }

  setWeights(val: number[]) {
    this.weights = val
    return this
  }

  clone(): Neuron {
    return new Neuron({
      weightRange: this.weightRange,
      biasRange: this.biasRange,
      bias: this.bias,
      weights: this.weights,
    })
  }

  toObject(): JSONEncodedNeuron {
    return {
      id: this.id,
      bias: this.bias,
      weightRange: this.weightRange,
      biasRange: this.biasRange,
      weights: this.weights,
    }
  }

  static fromObject({
    id,
    weights,
    bias,
    biasRange,
    weightRange,
  }: JSONEncodedNeuron): Neuron {
    return new Neuron({
      id,
      bias,
      biasRange,
      weightRange,
      weights,
    })
  }
}

type LayerOptions = Xor<
  {
    size: number
    weightRange?: [number, number]
    biasRange?: [number, number]
  },
  {
    neurons: Neuron[]
    weightRange?: [number, number]
    biasRange?: [number, number]
  }
>

interface JSONEncodedLayer {
  neurons: Neuron['id'][]
}

export class Layer {
  neurons: Neuron[]

  constructor({ size, neurons, biasRange, weightRange }: LayerOptions) {
    if (size) {
      this.neurons = []
      for (let i = 0; i < size; i++) {
        this.neurons.push(new Neuron({ biasRange, weightRange }))
      }
    } else {
      this.neurons = neurons!
    }
  }

  activate(input: number[]): number[] {
    return transpose(
      this.neurons.map((neuron, idx) => neuron.activate(input[idx]))
    ).map((output) => sigmoid(sum(output)))
  }

  setNeurons(neurons: Neuron[]) {
    this.neurons = neurons
    return this
  }

  connect(other: Layer): Layer {
    for (const otherNeurons of other.neurons) {
      for (const selfNeurons of this.neurons) {
        selfNeurons.connect(otherNeurons)
      }
    }
    return this
  }

  clone(): Layer {
    return new Layer({ neurons: this.neurons.map((neuron) => neuron.clone()) })
  }

  toObject(): JSONEncodedLayer {
    return {
      neurons: this.neurons.map(({ id }) => id),
    }
  }

  static fromObject(
    { neurons }: JSONEncodedLayer,
    neuronsMap: Record<Neuron['id'], Neuron>
  ): Layer {
    return new Layer({ neurons: neurons.map((id) => neuronsMap[id]) })
  }
}

interface NetworkOptions {
  inputLayer: Layer
  hiddenLayers: Layer[]
  outputLayer: Layer
  weightRange?: [number, number]
  biasRange?: [number, number]
}

export interface JSONEncodedNetwork {
  shape: {
    inputLayer: ReturnType<Layer['toObject']>
    hiddenLayers: ReturnType<Layer['toObject']>[]
    outputLayer: ReturnType<Layer['toObject']>
  }
  neurons: Record<Neuron['id'], ReturnType<Neuron['toObject']>>
}

export class Network {
  inputLayer: Layer
  hiddenLayers: Layer[]
  outputLayer: Layer

  constructor({ inputLayer, hiddenLayers, outputLayer }: NetworkOptions) {
    this.inputLayer = inputLayer
    this.hiddenLayers = hiddenLayers
    this.outputLayer = outputLayer
    this.inputLayer.connect(this.hiddenLayers[0])
    for (let i = 1; i < this.hiddenLayers.length; i++) {
      this.hiddenLayers[i - 1].connect(this.hiddenLayers[i])
    }
    this.hiddenLayers[this.hiddenLayers.length - 1].connect(this.outputLayer)
  }

  activate(input: number[]): number[] {
    let output = this.inputLayer.activate(input)
    for (const layer of this.hiddenLayers) {
      output = layer.activate(output)
    }
    return output
  }

  clone(): Network {
    return new Network({
      inputLayer: this.inputLayer.clone(),
      hiddenLayers: this.hiddenLayers.map((layer) => layer.clone()),
      outputLayer: this.outputLayer.clone(),
    })
  }

  get neurons(): Neuron[] {
    return [this.inputLayer, ...this.hiddenLayers, this.outputLayer].flatMap(
      (layer) => layer.neurons
    )
  }

  toObject(): JSONEncodedNetwork {
    return {
      shape: {
        inputLayer: this.inputLayer.toObject(),
        hiddenLayers: this.hiddenLayers.map((layer) => layer.toObject()),
        outputLayer: this.outputLayer.toObject(),
      },
      neurons: Object.fromEntries(
        this.neurons.map((neuron) => [neuron.id, neuron.toObject()] as const)
      ),
    }
  }

  toJson(): string {
    return JSON.stringify(this.toObject())
  }

  static fromObject({ neurons, shape }: JSONEncodedNetwork): Network {
    let neuronsMap: Record<Neuron['id'], Neuron> = {}
    for (const [id, json] of Object.entries(neurons)) {
      neuronsMap[id] = Neuron.fromObject(json)
    }

    return new Network({
      inputLayer: Layer.fromObject(shape.inputLayer, neuronsMap),
      hiddenLayers: shape.hiddenLayers.map((layer) =>
        Layer.fromObject(layer, neuronsMap)
      ),
      outputLayer: Layer.fromObject(shape.outputLayer, neuronsMap),
    })
  }

  static fromJson(json: string): Network {
    return Network.fromObject(JSON.parse(json))
  }
}

export function createPerceptron(
  input: number,
  hidden: number[],
  output: number,
  {
    weightRange = [-10, 10],
    biasRange = [-10, 10],
  }: { weightRange?: [number, number]; biasRange?: [number, number] } = {}
): Network {
  return new Network({
    inputLayer: new Layer({ size: input, weightRange, biasRange }),
    hiddenLayers: hidden.map(
      (size) => new Layer({ size, weightRange, biasRange })
    ),
    outputLayer: new Layer({ size: output, weightRange, biasRange }),
  })
}
