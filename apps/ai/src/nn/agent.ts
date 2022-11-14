import { createPerceptron, JSONEncodedNetwork, Network } from '.'
import { randn_bm } from '../utils'

export interface JSONEncodedAgent {
  brain: JSONEncodedNetwork
  fitness: number
}

export class Agent {
  brain: Network
  fitness: number

  constructor({
    brain,
    fitness = 0,
  }: { brain?: Network; fitness?: number } = {}) {
    this.fitness = fitness
    this.brain = brain || createPerceptron(3, [8, 12, 8], 2)
  }

  clone(): Agent {
    return new Agent({ brain: this.brain.clone() })
  }

  reward(n: number): this {
    this.fitness += n
    return this
  }

  punish(n: number) {
    return this.reward(-n)
  }

  mutate(p: number): this {
    if (Math.random() < p) {
      const neuron =
        this.brain.neurons[
          Math.floor(this.brain.neurons.length * Math.random())
        ]
      neuron.bias += randn_bm()
      for (const connection of neuron.connections) {
        connection.weight += randn_bm()
      }
    }
    return this
  }

  crossover(other: Agent): Agent {
    const a = this.brain.clone()
    const b = other.brain.clone()
    const a_neurons = a.neurons
    const b_neurons = b.neurons
    for (let i = 0; i < a.neurons.length; i++) {
      if (i % 2 === 0) {
        a_neurons[i] = b_neurons[i].clone()
      }
    }
    return new Agent({ brain: a })
  }

  toObject(): JSONEncodedAgent {
    return {
      brain: this.brain.toObject(),
      fitness: this.fitness,
    }
  }

  toJson(): string {
    return JSON.stringify(this.toObject())
  }

  static fromObject({ fitness, brain }: JSONEncodedAgent): Agent {
    return new Agent({
      fitness,
      brain: Network.fromObject(brain),
    })
  }

  static fromJson(json: string) {
    return this.fromObject(JSON.parse(json))
  }
}
