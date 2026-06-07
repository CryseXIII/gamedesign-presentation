export const launcherConfig = {
  url: (import.meta.env.VITE_LAUNCHER_URL || 'http://100.109.133.95:8765').trim(),
  token: (import.meta.env.VITE_LAUNCHER_TOKEN || '').trim(),
}

const jellyfinUrl = (import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.gamedesign.152.53.117.246.sslip.io/web/').trim()
const shokoUrl = (import.meta.env.VITE_SHOKO_URL || 'https://shoko.gamedesign.152.53.117.246.sslip.io/').trim()
const oobaChatUrl = (import.meta.env.VITE_OOBA_CHAT_URL || 'https://ooba.gamedesign.152.53.117.246.sslip.io/').trim()
const oobaApiUrl = (import.meta.env.VITE_OOBA_API_URL || 'https://ooba-api.gamedesign.152.53.117.246.sslip.io/v1/models').trim()
const sillyTavernUrl = (import.meta.env.VITE_SILLYTAVERN_URL || 'https://sillytavern.gamedesign.152.53.117.246.sslip.io/').trim()
const isPublicPortal = typeof window !== 'undefined' && window.location.hostname.endsWith('sslip.io') && !window.location.hostname.startsWith('100.')
const a1111Url = isPublicPortal ? '' : (import.meta.env.VITE_A1111_URL || 'http://100.109.133.95:7860').trim()
const comfyUiUrl = isPublicPortal ? '' : (import.meta.env.VITE_COMFYUI_URL || 'http://100.109.133.95:8189').trim()

export const portalUrls = [
  {
    label: 'Public Portal',
    url: 'https://gamedesign.152.53.117.246.sslip.io/#/portal',
    note: 'Public hub',
  },
  {
    label: 'Tailnet Portal',
    url: 'http://100.118.216.77:8080/#/portal',
    note: 'Private hub',
  },
]

export const internalPages = [
  {
    id: 'gameron',
    label: 'Gameron',
    description: 'Story, title screen, character creation, and the game flow.',
  },
  {
    id: 'snapshots',
    label: 'Snapshots',
    description: 'Manual snapshot, restore, and playback for the VPS stack.',
  },
  {
    id: 'workbench',
    label: 'Image Workbench',
    description: 'Model selection, crop editor, edit map, checkpoint approvals, and progress notifications.',
  },
]

export const serviceGroups = [
  {
    title: 'Media',
    note: 'External or private tools',
    items: [
      {
        label: 'Jellyfin',
        url: jellyfinUrl,
        description: 'Media library and playback.',
        fallback: 'Set VITE_JELLYFIN_URL to enable this link.',
      },
      {
        label: 'Shoko',
        url: shokoUrl,
        description: 'Anime metadata manager for Jellyfin. Public entry.',
        fallback: 'Set VITE_SHOKO_URL to enable this link.',
      },
    ],
  },
  {
    title: 'Internal Services',
    note: 'Tailnet only',
    items: [
      {
        label: 'Open WebUI',
        url: 'http://100.118.216.77:8080',
        description: 'Chat, tools, vision, planner.',
      },
      {
        label: 'Proxmox',
        url: 'https://100.118.216.77:8006',
        description: 'Host UI and VM/container management.',
      },
      {
        label: 'n8n / Telegram Bot',
        url: 'http://100.118.216.77:5678',
        description: 'Automation and bot workflows.',
      },
      {
        label: 'Oobabooga API',
        url: oobaApiUrl,
        description: 'OpenAI-compatible LLM API models endpoint. Public entry.',
      },
      {
        label: 'Oobabooga Raw Chat',
        url: oobaChatUrl,
        description: 'Direct chat UI with less wrapping. Public entry.',
      },
      {
        label: 'SillyTavern',
        url: sillyTavernUrl,
        description: 'Roleplay frontend that can point at the Oobabooga API.',
        fallback: 'Set VITE_SILLYTAVERN_URL to override this link.',
      },
      {
        label: 'Scene Worker',
        url: 'https://scene-worker.gamedesign.152.53.117.246.sslip.io',
        description: 'RP excerpt to image worker for SillyTavern.',
      },
      {
        label: 'A1111',
        url: a1111Url,
        description: 'Img2img, inpaint, model switch. Tailnet only.',
        fallback: 'Open from the Tailscale portal or set VITE_A1111_URL locally.',
      },
      {
        label: 'ComfyUI',
        url: comfyUiUrl,
        description: 'Mask, pose, nodes, and complex workflows. Tailnet only.',
        fallback: 'Open from the Tailscale portal or set VITE_COMFYUI_URL locally.',
      },
    ],
  },
]

export const snapshotPolicy = {
  engine: 'Borg deduplication',
  tiering: 'NAS if the backup set grows beyond the local threshold; otherwise a dedicated LXC repo.',
  restoreModel: 'Restore to original machine or clone for playback.',
  progressModel: 'Percent complete plus ETA for backup and restore jobs.',
}
