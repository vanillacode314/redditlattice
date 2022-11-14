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
const DISLIKED: Set<string> = new Set()

import { useUserState } from './stores'

const [userState] = useUserState()
const subreddits = () => userState().subreddits
const searchTerms = () => userState().searchTerms

export function saveState() {
  localStorage.setItem(LS_KEY, savePopulation())
}

export function removeState() {
  localStorage.removeItem(LS_KEY)
}

export function loadState() {
  const json = localStorage.getItem(LS_KEY)
  if (json) {
    loadPopulation(json)
  } else {
    initializePopulation(bestEngine())
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

export function getSuggestions(limit: number = 5) {
  const engine = bestEngine()
  const predict = engine.toFunction()
  const getInputs = (sr: string, q: string) =>
    [
      [...subreddits().values()].indexOf(sr) / ARR_LIMIT,
      [...searchTerms().keys()].indexOf(q) / ARR_LIMIT,
    ] as const
  const pairs = sortBy(
    getPairs().map(([sr, q]) => {
      const [predictionIfUserWillLikeThisPair, [p1, p2]] = predict(
        ...getInputs(sr, q)
      )
      let weight = p1 + p2
      if (predictionIfUserWillLikeThisPair && DISLIKED.has(`${sr}?${q}`)) {
        weight = 0
        trainRatingEngine(getInputs(sr, q), false)
      }
      return [sr, q, predictionIfUserWillLikeThisPair, weight] as const
    }),
    ([, , , weight]) => weight
  )
  return pairs.slice(Math.max(pairs.length - limit, 0)).map(
    ([sr, q]) =>
      [
        [sr, q],
        (goodPair: boolean) => {
          if (!goodPair) DISLIKED.add(`${sr}?${q}`)
          trainRatingEngine(getInputs(sr, q), goodPair)
        },
      ] as const
  )
}