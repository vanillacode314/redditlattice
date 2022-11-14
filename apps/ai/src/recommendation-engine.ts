import { createPerceptron, Network } from './nn'
import { chooseFromWeighted } from './utils'
import { maxBy } from 'lodash-es'
import inquirer from 'inquirer'
import { Agent } from './nn/agent'

const subreddits: string[] = []
const searchTerms: string[] = []

const POPULATION_SIZE = 5

const createIndex = <T = unknown>(arr: T[]) =>
  Object.fromEntries(arr.map((val, idx) => [idx, val]))

const subredditsIndex = createIndex(subreddits)
const searchTermsIndex = createIndex(searchTerms)

class RecommendationEngine {
  agent: Agent

  constructor({ brain }: { brain?: Network } = {}) {
    brain = createPerceptron(3, [8, 8], 2)
    this.agent = new Agent({ brain })
  }

  suggest() {
    const [prediction1, prediction2] = this.agent.brain.activate([
      subreddits.length,
      searchTerms.length,
      Math.random(),
    ])
    return [
      {
        subreddits:
          subredditsIndex[Math.floor(Math.random() * subreddits.length)],
        searchTerms:
          searchTermsIndex[Math.floor(Math.random() * searchTerms.length)],
      },
      [prediction1, prediction2],
    ] as const
  }

  mutate(p: number): RecommendationEngine {
    this.agent.mutate(p)
    return this
  }

  crossover(other: RecommendationEngine): RecommendationEngine {
    const agent = this.agent.crossover(other.agent)
    return new RecommendationEngine({ brain: agent.brain })
  }

  clone(): RecommendationEngine {
    const brain = this.agent.brain.clone()
    return new RecommendationEngine({ brain })
  }
}
function nextGen(currentGen: RecommendationEngine[]): RecommendationEngine[] {
  const newGen = []
  const bestEngine = maxBy(currentGen, (engine) => 1 / engine.agent.fitness)!
  newGen.push(bestEngine.clone())
  for (let i = 1; i < POPULATION_SIZE; i++) {
    const mother = chooseFromWeighted(
      currentGen.map((engine) => [engine, engine.agent.fitness])
    )
    const offspring: RecommendationEngine = bestEngine
      .crossover(mother)
      .mutate(0.1)
    newGen.push(offspring)
  }
  return newGen
}

async function trainRecommendationEngine() {
  // Initial Population
  let engines: RecommendationEngine[] = []
  for (let i = 0; i < POPULATION_SIZE; i++) {
    engines.push(new RecommendationEngine())
  }

  // Evolve population
  while (true) {
    for (const engine of engines) {
      const [data] = engine.suggest()
      /* if (data.subreddits.length === 0) { */
      /*   agent.reward(-1); */
      /*   continue; */
      /* } */
      console.log(data)
      const { good } = await inquirer.prompt([
        {
          type: 'confirm',
          default: false,
          name: 'good',
          message: 'Is this a good suggesstion',
        },
      ])
      engine.agent.reward(good ? 1 : -1)
    }
    engines = nextGen(engines)
  }
}
