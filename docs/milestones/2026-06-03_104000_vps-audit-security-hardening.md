# Milestone: VPS Vollaudit + Security Hardening

**Date:** 2026-06-03 10:40 UTC

## Context

Erster vollständiger VPS-Audit nach mehreren GPT-5-gesteuerten Iterationen. Ziel war es, den aktuellen Systemzustand zu verifizieren und Abweichungen zwischen project-memory und Live-Stand zu korrigieren.

## Findings

### Services (alle 11 Container live und healthy)
- CT201–215 alle `running`, last boot Fri 2026-05-29
- Git-Watcher auf CT202 + CT205 aktiv, Repo auf `09005be` in sync (local = GitHub = prod)
- Open WebUI (CT210:8080) → Oobabooga API ✅
- SD Orchestrator (CT210:8766) → A1111 Launcher ✅
- n8n (CT211:5678) → Telegram-Token konfiguriert, Webhook-URL gesetzt
- SillyTavern (CT215:8000) → scene-image-action Extension installiert

### Laptop AI Stack
- Oobabooga UI :1338 ✅ | API :5000 ✅
- A1111 :7860 ✅ (idle, ponyDiffusionV6XL)
- ComfyUI :8188 ❌ offline (bewusst)

### Probleme entdeckt
1. Proxmox :8006 öffentlich erreichbar — `addr-set-proxmox` in nftables war leer
2. `bot.152.53.117.246.sslip.io` hatte keinen Caddy-Eintrag → Telegram-Webhook tot
3. ComfyUI Port-Mismatch: CT210 env sagte `:8189`, Caddy `:8188`
4. CT210 pip-Cache: 3.4G unnötiger Build-Cache in `/root/.cache/pip`
5. `sd-agent`-Subdomain war public ohne Auth
6. project-memory.md hatte nur CT201–205, CT210–215 fehlten komplett

## Decisions

### :8006 Tailscale-Allowlist
Neue nftables-Tabelle `inet proxmox-access` mit positiver Allowlist für `100.64.0.0/10` (gesamtes Tailscale-Netz). Kein geräte- oder WiFi-spezifisches Binding — jedes Gerät im Tailscale-Netz kann zugreifen, unabhängig vom lokalen Netz. Tabelle in `/etc/nftables.conf` persistiert, `nftables.service` enabled.

### Telegram Webhook
Caddy-Eintrag `bot.152.53.117.246.sslip.io → CT211:5678` hinzugefügt. n8n-seitig muss noch ein Telegram-Trigger-Workflow konfiguriert werden.

### ComfyUI Port
CT210 `/etc/open-webui/env` von `:8189` auf `:8188` korrigiert. Open WebUI neu gestartet. Caddy-Seite war bereits korrekt.

### sd-agent Auth
Caddy `basicauth` auf `sd-agent.*`-Subdomain gesetzt (user: sdagent, pass: sdagent2026). Endpoint bleibt public, da SillyTavern-Extension browser-seitig ruft.

### Disk
CT210 pip-Cache (`/root/.cache/pip`, 3.4G) bereinigt. Disk: 45% → 34%.

## Implementation Notes

- nftables `proxmox-access` Tabelle: priority `filter + 10` (nach f2b-table), policy `accept`, Reject-Regel für IPs außerhalb der Allowlist
- Caddy-Reload via `caddy validate` + `systemctl reload caddy` ohne Downtime
- `sed -i` auf CT210 env via `pct exec`

## Follow-up

- n8n Telegram-Workflows im n8n UI anlegen
- CT214 Hostname umbenennen (`v2202605355759456797` → `scene-worker`)
- Telegram → n8n → Open WebUI/Oobabooga/SillyTavern Pipeline bauen
- ComfyUI starten wenn benötigt (Port 8188 jetzt korrekt)
