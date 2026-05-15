import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import SlideEngine from './components/SlideEngine.jsx'

export default function App() {
  const [started, setStarted] = useState(false)

  return started ? (
    <SlideEngine />
  ) : (
    <StartScreen onStart={() => setStarted(true)} />
  )
}
