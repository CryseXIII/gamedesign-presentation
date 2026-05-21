const jellyfinUrl = (import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.gamedesign.152.53.117.246.sslip.io/web/').trim()

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
        label: 'Oobabooga',
        url: 'http://100.109.133.95:5000',
        description: 'OpenAI-compatible LLM and vision API.',
      },
      {
        label: 'A1111',
        url: 'http://100.109.133.95:7860',
        description: 'Img2img, inpaint, model switch.',
      },
      {
        label: 'ComfyUI',
        url: 'http://100.109.133.95:8189',
        description: 'Mask, pose, nodes, and complex workflows.',
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
