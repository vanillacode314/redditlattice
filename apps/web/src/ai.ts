import {
  savePopulation,
  loadPopulation,
  bestEngine,
  initializePopulation,
  trainRatingEngine,
} from 'ai'
import { sortBy } from 'lodash-es'

const LS_KEY = 'rating-engine-population'
const ARR_LIMIT = 10000
let RATED: Map<string, boolean> = new Map()

import { useUserState } from './stores'

const [userState] = useUserState()
const subreddits = () => userState().subreddits
const searchTerms = () => userState().searchTerms

export function saveState() {
  localStorage.setItem(LS_KEY, savePopulation())
  localStorage.setItem('rated', JSON.stringify([...RATED]))
}

export function removeState() {
  localStorage.removeItem(LS_KEY)
  localStorage.removeItem('rated')
}

export function loadState() {
  const json = localStorage.getItem(LS_KEY)
  const ratings = localStorage.getItem('rated')
  if (ratings) {
    RATED = new Map(JSON.parse(ratings))
  }
  if (json) {
    loadPopulation(json)
  } else {
    initializePopulation()
  }
}

function getPairs(): (readonly [string, string])[] {
  const result = []
  for (const sr of subreddits()) {
    for (const [q] of searchTerms()) {
      result.push([sr, q] as const)
    }
  }
  return result
}

const getInputs = (sr: string, q: string) =>
  [
    [...subreddits().values()].indexOf(sr) / ARR_LIMIT,
    [...searchTerms().keys()].indexOf(q) / ARR_LIMIT,
  ] as const

const ratings: [readonly [number, number], boolean][] = []
function train(inputs: readonly [number, number], goodPair: boolean) {
  ratings.push([inputs, goodPair])
  if (ratings.length >= 1) {
    trainRatingEngine(ratings)
    ratings.length = 0
  }
}

export function getSuggestions(limit: number = 5) {
  const engine = bestEngine()
  const predict = engine.toFunction()

  const pairs = sortBy(
    getPairs()
      .map(([sr, q]) => {
        const [predictionIfUserWillLikeThisPair, [p1, p2]] = predict(
          ...getInputs(sr, q)
        )
        const weight = p1 + p2
        return [sr, q, predictionIfUserWillLikeThisPair, weight] as const
      })
      .filter(
        ([sr, q]) => !(RATED.has(`${sr}?${q}`) && !RATED.get(`${sr}?${q}`))
      ),
    ([, , , weight]) => weight
  )

  return pairs.slice(Math.max(pairs.length - limit, 0)).map(
    ([sr, q]) =>
      [
        [sr, q],
        (goodPair: boolean) => {
          RATED.set(`${sr}?${q}`, goodPair)
          train(getInputs(sr, q), goodPair)
          saveState()
        },
      ] as const
  )
}
