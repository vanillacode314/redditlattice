import { createPerceptron } from './nn'
import { chooseFromWeighted } from './utils'
import { maxBy, minBy } from 'lodash-es'
import { Agent, JSONEncodedAgent } from './nn/agent'

const POPULATION_SIZE = 150

export class RatingEngine {
  agent: Agent

  constructor({ agent }: { agent?: Agent } = {}) {
    this.agent = agent || new Agent({ brain: createPerceptron(3, [3, 3], 2) })
  }

  predict(subreddit: number, searchTerm: number) {
    const [prediction1, prediction2] = this.agent.brain.activate([
      subreddit,
      searchTerm,
      Math.random(),
    ])

    return [1 > prediction1 + prediction2, [prediction1, prediction2]] as const
  }

  mutate(p: number): RatingEngine {
    this.agent.mutate(p)
    return this
  }

  crossover(other: RatingEngine): RatingEngine {
    const agent = this.agent.crossover(other.agent)
    return new RatingEngine({ agent })
  }

  clone(): RatingEngine {
    const agent = this.agent.clone()
    return new RatingEngine({ agent })
  }

  toObject() {
    return this.agent.toObject()
  }

  toJson() {
    return JSON.stringify(this.toObject())
  }

  toFunction(): (
    subreddit: number,
    searchTerm: number
  ) => readonly [boolean, [number, number]] {
    const fn = this.agent.brain.toFunction()
    return (subreddit: number, searchTerm: number) => {
      const [prediction1, prediction2] = fn([
        subreddit,
        searchTerm,
        Math.random(),
      ])
      return [1 > prediction1 + prediction2, [prediction1, prediction2]]
    }
  }

  static fromObject(agent: JSONEncodedAgent): RatingEngine {
    return new RatingEngine({
      agent: Agent.fromObject(agent),
    })
  }

  static fromJson(json: string) {
    return this.fromObject(JSON.parse(json))
  }
}

function nextGen(currentGen: RatingEngine[]): RatingEngine[] {
  const newGen = []
  const bestEngine = maxBy(currentGen, (engine) => engine.agent.fitness)!
  newGen.push(bestEngine.clone())
  for (let i = 2; i < POPULATION_SIZE; i++) {
    const father = chooseFromWeighted(
      currentGen.map((engine) => [engine, engine.agent.fitness])
    )
    const mother = chooseFromWeighted(
      currentGen.map((engine) => [engine, engine.agent.fitness])
    )
    const offspring: RatingEngine = father.crossover(mother).mutate(0.1)
    newGen.push(offspring)
  }
  const worstEngine = minBy(currentGen, (engine) => engine.agent.fitness)!
  newGen.push(bestEngine.crossover(worstEngine).mutate(0.1))
  return newGen
}

let engines: RatingEngine[] = []

export const bestEngine = () =>
  engines.length > 0
    ? maxBy(engines, (engine) => engine.agent.fitness)!
    : new RatingEngine()

export const savePopulation = () =>
  JSON.stringify(engines.map((engine) => engine.toObject()))

export const loadPopulation = (json: string) =>
  (engines = (JSON.parse(json) as JSONEncodedAgent[]).map((engine) =>
    RatingEngine.fromObject(engine)
  ))

export const initializePopulation = () => {
  engines = []
  for (let i = 1; i < POPULATION_SIZE; i++) {
    engines.push(new RatingEngine())
  }
}

export function trainRatingEngine(
  inputs: [readonly [number, number], boolean][]
): RatingEngine {
  for (const [[i1, i2], goodPair] of inputs) {
    for (const engine of engines) {
      const [prediction, [p1, p2]] = engine.predict(i1, i2)
      if (goodPair) {
        prediction
          ? engine.agent.reward(p1 + p2)
          : engine.agent.punish(1 / (p1 + p2))
      } else {
        prediction
          ? engine.agent.punish(p1 + p2)
          : engine.agent.reward(1 / (p1 + p2))
      }
    }
  }
  engines = nextGen(engines)
  return bestEngine()
}
