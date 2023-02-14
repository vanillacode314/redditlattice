import { Motion } from '@motionone/solid'
import { spring } from 'motion'
import { children, Component, For, JSXElement, Match, Switch } from 'solid-js'

import { createStore } from 'solid-js/store'
import z from 'zod'

interface TabsProps {
  activeTab?: number
  children: JSXElement
}

const stateSchema = z.object({
  activeTab: z.number().default(0),
})
export const Tabs: Component<TabsProps> = (props) => {
  const [state, setState] = createStore<z.infer<typeof stateSchema>>(
    stateSchema.parse({ activeTab: props.activeTab })
  )

  const tabs = children(() => props.children)

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex h-full items-end">
        <For each={tabs.toArray() as unknown as TabProps[]}>
          {(tab, index) => (
            <Motion.div
              animate={{
                transform: `translateX(${state.activeTab * -100}%)`,
              }}
              transition={{
                easing: spring(),
              }}
              class="w-full shrink-0 grow flex justify-end flex-col"
            >
              {tab.children}
            </Motion.div>
          )}
        </For>
      </div>
      <div class="overflow-x-auto hidescrollbar shrink-0">
        <div class="gap-5 flex">
          <For each={tabs.toArray() as unknown as TabProps[]}>
            {(tab, index) => (
              <button
                class="uppercase font-bold text-sm tracking-wider p-5 shrink-0 w-[calc(33%-0.625rem)] transition-colors"
                classList={{
                  'text-gray-100': state.activeTab === index(),
                  'text-gray-500': state.activeTab !== index(),
                }}
                onClick={() => setState({ activeTab: index() })}
              >
                {tab.title}
              </button>
            )}
          </For>
        </div>
        <Motion.div
          class="border-b-2 w-[calc(33%-0.625rem)]"
          animate={{
            transform: `translateX(calc(${state.activeTab} * (100% + 1.25rem)))`,
          }}
          transition={{
            easing: spring(),
          }}
        ></Motion.div>
      </div>
    </div>
  )
}

interface TabProps {
  title: string
  icon?: string
  children: JSXElement
}
export const Tab: Component<TabProps> = (props) => {
  return props as unknown as JSXElement
}
