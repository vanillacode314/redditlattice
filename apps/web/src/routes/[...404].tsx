import { Navigate } from 'solid-start'
import { HttpStatusCode } from 'solid-start/server'

export default function Home() {
  return (
    <>
      <HttpStatusCode code={404} />
      <Navigate href="/" />
    </>
  )
}
