import { onMount } from 'solid-js'
import { useAppState } from '~/stores'

export default function About() {
  const [, setAppState] = useAppState()
  onMount(() => setAppState('title', 'About'))

  return (
    <div
      class="flex flex-col-reverse gap-5 py-5 h-full max-w-xl mx-auto w-full"
      ref={(el) => setAppState('scrollElement', el)}
    >
      <div flex flex-col-reverse gap-2>
        <span px-5 text="xs gray-500" font="bold" uppercase v-if="title">
          Summary
        </span>
        <div px-5 flex flex-col gap-5>
          <p>
            A FOSS reddit viewer for image based subreddits. Lays out the images
            in a tight lattice. Written in{' '}
            <a
              href="https://start.solidjs.com/getting-started/what-is-solidstart"
              class="text-pink-300 visited:text-pink-800 hover:text-pink-500 hover:underline focus:text-pink-500 focus:underline"
            >
              SolidStart
            </a>
            .
          </p>
          <p>
            Uses a custom server to resize images on the fly for faster loading.
          </p>
          <p>
            I freelance as a professional web developer. Contact ME if you need
            my services
          </p>
        </div>
      </div>
      <div flex flex-col-reverse gap-2>
        <span px-5 text="xs gray-500" font="bold" uppercase v-if="title">
          links
        </span>
        <ul>
          <li>
            <a
              style={{ '-webkit-tap-highlight-color': 'transparent' }}
              href="https://raqueebuddinaziz.com/#contact"
              px-5
              py-3
              flex
              gap-5
              items-center
              bg="black hover:gray-900"
            >
              <div text="2xl" class="i-mdi-face-man-profile"></div>
              <span text="sm" tracking-wide font="bold" uppercase>
                Contact Me
              </span>
            </a>
          </li>
          <li>
            <a
              style={{ '-webkit-tap-highlight-color': 'transparent' }}
              href="https://github.com/vanillacode314/redditlattice"
              px-5
              py-3
              flex
              gap-5
              items-center
              bg="black hover:gray-900"
            >
              <div text="2xl" class="i-mdi-code-braces"></div>
              <span text="sm" tracking-wide font="bold" uppercase>
                Source Code
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
