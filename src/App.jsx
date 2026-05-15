import { useState } from 'react'
import CharacterSelect from './components/CharacterSelect.jsx'
import GameScreen      from './components/GameScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('title')
  const [gender, setGender] = useState('male')

  if (screen === 'title') {
    return (
      <CharacterSelect
        onStart={(selectedGender) => {
          setGender(selectedGender)
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GameScreen
        gender={gender}
        charConfig={null}
        onExit={() => setScreen('title')}
      />
    )
  }

  return null
}
