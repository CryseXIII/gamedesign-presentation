import { useState } from 'react'
import StartScreen from './components/StartScreen.jsx'
import CharacterCreate from './components/CharacterCreate.jsx'
import GameScreen from './components/GameScreen.jsx'

export default function App() {
  const [screen,     setScreen]     = useState('title')
  const [charConfig, setCharConfig] = useState(null)

  if (screen === 'title') {
    return <StartScreen onStart={() => setScreen('create')} />
  }

  if (screen === 'create') {
    return (
      <CharacterCreate
        onConfirm={(config) => {
          setCharConfig(config)
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'game') {
    return <GameScreen charConfig={charConfig} onExit={() => setScreen('title')} />
  }

  return null
}
