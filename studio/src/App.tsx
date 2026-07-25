import { AppShell } from './shell/AppShell'
import { Toaster } from './shell/Toaster'
import { AiPanel } from './shell/AiPanel'

export function App() {
  return (
    <>
      <AppShell />
      <AiPanel />
      <Toaster />
    </>
  )
}
