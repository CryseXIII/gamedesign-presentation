import { useEffect, useState } from 'react'
import StartScreen     from './components/StartScreen.jsx'
import CharacterSelect from './components/CharacterSelect.jsx'
import CharacterCreate from './components/CharacterCreate.jsx'
import GameScreen      from './components/GameScreen.jsx'
import PortalScreen    from './components/PortalScreen.jsx'
import ImageWorkbench  from './components/ImageWorkbench.jsx'
import SnapshotCenter  from './components/SnapshotCenter.jsx'
import VisionPortal    from './components/VisionPortal.jsx'

const ROUTES = new Set(['portal', 'gameron', 'snapshots', 'workbench', 'vision', 'select', 'create', 'game'])

function canOpenVision() {
  return true
}

function readRoute() {
  if (typeof window === 'undefined') return 'portal'

  const hostname = window.location.hostname
  const raw = window.location.hash.replace(/^#\/?/, '')
  if (raw === 'vision' && canOpenVision()) return raw
  if (ROUTES.has(raw) && raw !== 'vision') return raw

  const pathname = window.location.pathname.replace(/\/+$/, '')
  if (hostname.startsWith('vision.') && canOpenVision()) {
    return 'vision'
  }

  if (canOpenVision() && pathname.endsWith('/vision')) {
    return 'vision'
  }

  return 'portal'
}

export default function App() {
  const [screen,     setScreen]     = useState(() => readRoute())
  const [gender,     setGender]     = useState('male')
  const [charConfig, setCharConfig] = useState(null)

  useEffect(() => {
    function syncRoute() {
      setScreen(readRoute())
    }

    if (!window.location.hash) {
      window.location.hash = `#/${screen}`
    } else {
      syncRoute()
    }

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  function navigate(next) {
    if (next === 'vision' && !canOpenVision()) {
      next = 'portal'
    }
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
        onOpenWorkbench={() => navigate('workbench')}
        onOpenVision={() => navigate('vision')}
      />
    )
  }

  if (screen === 'gameron') {
    return <StartScreen onStart={() => navigate('select')} onPortal={() => navigate('portal')} />
  }

  if (screen === 'snapshots') {
    return <SnapshotCenter onBack={() => navigate('portal')} />
  }

  if (screen === 'workbench') {
    return <ImageWorkbench onBack={() => navigate('portal')} />
  }

  if (screen === 'vision') {
    return <VisionPortal onBack={() => navigate('portal')} />
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
