import { createComputed } from 'solid-js'
import { createStore } from 'solid-js/store'
import { isServer } from 'solid-js/web'
import z from 'zod'

interface LocalStorageStoreOptions<
  TSchema extends z.ZodTypeAny,
  TData = z.input<TSchema>
> {
  schema: TSchema
  serializer: (input: TData) => string
  deserializer: (input: string) => TData
}
export const createLocalStorageStore = <
  TSchema extends z.ZodTypeAny,
  TData extends Record<string, unknown> = z.input<TSchema>
>(
  localStorageKey: string,
  defaultValue: TData,
  {
    schema = z.any() as any,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  }: Partial<LocalStorageStoreOptions<TSchema>> = {}
) => {
  const [store, setStore] = createStore<z.output<TSchema>>(defaultValue)

  function getLocalStorageValue() {
    const localStorageValue = localStorage.getItem(localStorageKey)
    if (!localStorageValue) {
      localStorage.setItem(
        localStorageKey,
        serializer(schema.parse(defaultValue))
      )
      return
    }

    try {
      setStore(schema.parse(deserializer(localStorageValue)))
    } catch {
      localStorage.setItem(
        localStorageKey,
        serializer(schema.parse(defaultValue))
      )
    }
  }

  if (!isServer) {
    getLocalStorageValue()
    window.addEventListener('storage', () => getLocalStorageValue())
  }

  createComputed(() => {
    if (!isServer)
      localStorage.setItem(localStorageKey, serializer(schema.parse(store)))
  })

  return [store, setStore] as const
}
