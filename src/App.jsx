import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import GameScreen  from './components/GameScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('title')

  if (screen === 'title') {
    return <StartScreen onStart={() => setScreen('game')} />
  }

  if (screen === 'game') {
    return <GameScreen charConfig={null} onExit={() => setScreen('title')} />
  }

  return null
}
