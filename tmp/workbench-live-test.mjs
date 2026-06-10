import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire('file:///C:/Users/Viktor/Desktop/OpenCode/vps-architecture/test-runner/package.json')
const { chromium } = require('playwright')

const file = 'C:\\Users\\Viktor\\Downloads\\0759a202de7ebaf018c8b7ae0d80564c.jpeg'
const exportDir = 'C:\\Users\\Viktor\\Desktop\\checkpoint-inspect'
const exportPath = `${exportDir}\\latest.zip`

fs.mkdirSync(exportDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage({
  ignoreHTTPSErrors: true,
  viewport: { width: 1680, height: 1200 },
})

const events = []
page.on('console', (msg) => events.push(['console', msg.type(), msg.text()]))
page.on('pageerror', (err) => events.push(['pageerror', err.message]))
page.on('request', (req) => {
  const url = req.url()
  if (/models|generate|inpaint|switch|loras|comfy|sd-orchestrator|caddy|vision|workbench/i.test(url)) {
    events.push(['request', req.method(), url])
  }
})
page.on('response', (res) => {
  const url = res.url()
  if (/models|generate|inpaint|switch|loras|comfy|sd-orchestrator|caddy|vision|workbench/i.test(url)) {
    events.push(['response', res.status(), url])
  }
})

await page.goto('https://gamedesign.152.53.117.246.sslip.io/#/workbench', { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForSelector('text=Image Workbench', { timeout: 120000 })
await page.waitForTimeout(1500)

const screen = page.locator('.wbx-screen')
const scrollInfo1 = await screen.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop }))
await page.mouse.wheel(0, 1800)
await page.waitForTimeout(1000)
const scrollInfo2 = await screen.evaluate((el) => ({ scrollTop: el.scrollTop }))

await page.locator('label:has-text("Pinned checkpoint") select').selectOption('albedobaseXL_v13.safetensors')
await page.getByRole('button', { name: 'Sync model' }).click()
await page.waitForTimeout(1000)

const upload = page.locator('.wbx-panel').filter({ hasText: 'Base Image' }).locator('input[type="file"]').first()
await upload.setInputFiles(file)
await page.waitForTimeout(2000)

const viewport = page.locator('.wbx-viewport')
const box = await viewport.boundingBox()
await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.28)
await page.mouse.down({ button: 'right' })
await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.58, { steps: 12 })
await page.mouse.up({ button: 'right' })
await page.waitForTimeout(1000)

await page.getByRole('button', { name: 'Stamp cutout' }).click()
await page.waitForTimeout(1500)
await page.locator('.wbx-mini-stack .wbx-preview-button').click()
await page.waitForSelector('.wbx-modal', { timeout: 120000 })
await page.locator('.wbx-modal').getByRole('button', { name: 'Paint' }).click()

const editorCanvas = page.locator('.wbx-editor-stage__canvas')
const ebox = await editorCanvas.boundingBox()

await page.mouse.move(ebox.x + ebox.width * 0.20, ebox.y + ebox.height * 0.22)
await page.mouse.down({ button: 'left' })
await page.mouse.move(ebox.x + ebox.width * 0.40, ebox.y + ebox.height * 0.28, { steps: 10 })
await page.mouse.move(ebox.x + ebox.width * 0.52, ebox.y + ebox.height * 0.24, { steps: 8 })
await page.mouse.up({ button: 'left' })
await page.waitForTimeout(500)

await page.mouse.move(ebox.x + ebox.width * 0.58, ebox.y + ebox.height * 0.58)
await page.mouse.down({ button: 'left' })
await page.mouse.move(ebox.x + ebox.width * 0.78, ebox.y + ebox.height * 0.68, { steps: 10 })
await page.mouse.move(ebox.x + ebox.width * 0.84, ebox.y + ebox.height * 0.60, { steps: 8 })
await page.mouse.up({ button: 'left' })
await page.waitForTimeout(500)

await page.getByRole('textbox', { name: 'SD prompt' }).fill('Preserve the style of the source image, but generate ripe yellow bananas in the marked colored regions. Keep the rest of the image unchanged, same lighting, same composition, same material feel.')
await page.locator('.wbx-modal .wbx-mini--primary').click()
await page.waitForTimeout(1500)
await page.waitForSelector('.wbx-preview-wrap--checker img', { timeout: 120000 })

const responsePromise = page.waitForResponse((res) => res.url().includes('/inpaint') || res.url().includes('/generate/planned'), { timeout: 240000 }).catch((error) => error)
await page.locator('.wbx-output-panel .wbx-mini').first().click()
const response = await responsePromise
await page.waitForTimeout(5000)

await page.getByRole('button', { name: 'Approve cutout' }).click()
await page.waitForTimeout(1500)
await page.getByRole('button', { name: 'Merge to base' }).click()
await page.waitForTimeout(2000)
await page.getByRole('button', { name: 'Keep newest only' }).click()
await page.waitForTimeout(1000)

const downloadPromise = page.waitForEvent('download', { timeout: 120000 })
await page.getByRole('button', { name: 'Download' }).click()
const download = await downloadPromise
await download.saveAs(exportPath)

const checkpointText = await page.locator('.wbx-checkpoint').first().innerText().catch(() => '')
const checkpointCount = await page.locator('.wbx-checkpoint').count()
const editMapSrc = await page.locator('.wbx-preview-wrap--checker img').getAttribute('src').catch(() => '')
const baseLoaded = await page.locator('.wbx-dropzone img').count()

console.log(JSON.stringify({
  scrollInfo1,
  scrollInfo2,
  checkpointCount,
  checkpointText,
  editMapLength: editMapSrc?.length || 0,
  baseLoaded,
  exportPath,
  response: response instanceof Error ? { error: response.message } : { status: response.status(), url: response.url() },
  events: events.slice(-50),
}, null, 2))

await browser.close()
