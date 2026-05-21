import { useEffect, useState } from 'react'
import StartScreen     from './components/StartScreen.jsx'
import CharacterSelect from './components/CharacterSelect.jsx'
import CharacterCreate from './components/CharacterCreate.jsx'
import GameScreen      from './components/GameScreen.jsx'
import PortalScreen    from './components/PortalScreen.jsx'
import SnapshotCenter  from './components/SnapshotCenter.jsx'

const ROUTES = new Set(['portal', 'gameron', 'snapshots', 'select', 'create', 'game'])

function readRoute() {
  if (typeof window === 'undefined') return 'portal'

  const raw = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.has(raw) ? raw : 'portal'
}

export default function App() {
  const [screen,     setScreen]     = useState('portal')
  const [gender,     setGender]     = useState('male')
  const [charConfig, setCharConfig] = useState(null)

  useEffect(() => {
    function syncRoute() {
      setScreen(readRoute())
    }

    if (!window.location.hash) {
      window.location.hash = '#/portal'
    } else {
      syncRoute()
    }

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  function navigate(next) {
    const hash = `#/${next}`
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
    setScreen(next)
  }

  if (screen === 'portal') {
    return (
      <PortalScreen
        onOpenGameron={() => navigate('gameron')}
        onOpenSnapshots={() => navigate('snapshots')}
      />
    )
  }

  if (screen === 'gameron') {
    return <StartScreen onStart={() => navigate('select')} onPortal={() => navigate('portal')} />
  }

  if (screen === 'snapshots') {
    return <SnapshotCenter onBack={() => navigate('portal')} />
  }

  if (screen === 'select') {
    return (
      <CharacterSelect
        onStart={(selectedGender) => {
          setGender(selectedGender)
          navigate('create')
        }}
      />
    )
  }

  if (screen === 'create') {
    return (
      <CharacterCreate
        defaultIsFemale={gender === 'female'}
        onConfirm={(config) => {
          setCharConfig(config)
          navigate('game')
        }}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GameScreen
        gender={gender}
        charConfig={charConfig}
        onExit={() => navigate('portal')}
      />
    )
  }

  return null
}
