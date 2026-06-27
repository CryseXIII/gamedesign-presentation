# Context Sync vollständig + FlowShift installiert

## Context
- Multi-device OpenCode Sync war vorbereitet (AGENTS.md + Scripts), aber VPS-Timer fehlten und GitHub-Auth fehlte
- FlowShift (Software-Display-Matrix-Switch) sollte auf dem Laptop installiert werden

## Entscheidungen
1. **SSH-Deploy-Keys statt PAT** – für VPS-Container, da `git credential store` auf headless LXCs nicht praktikabel ist
2. **Python-Prototyp** – FlowShift hat Rust + Python; Zero-Dep Python-Prototyp ist sofort lauffähig auf Windows

## Durchgeführt
### VPS Context Sync
- SSH-Keys auf CT202 (`gd-dev`) und CT205 (`gd-prod`) generiert
- Beide Keys via GitHub API als Deploy-Keys zum Repo hinzugefügt (`CryseXIII/gamedesign-presentation`)
- Git Remote auf beiden Containern auf `git@github.com:` umgestellt
- Systemd Timer `docs-auto-sync.timer` auf CT202 + CT205 deployt, enabled und gestartet (alle 10 Minuten)
- `docs-auto-sync.sh` gefixt: erkennt jetzt auch untracked files (via `git status --porcelain`)
- Git user.email/user.name auf beiden Containern gesetzt

### FlowShift (Laptop)
- Repo `CryseXIII/flowshift` geklont nach `C:\Users\Viktor\Desktop\OpenCode\flowshift\`
- Python-Prototyp (Zero-Dep, stdlib + ctypes) identifiziert
- AppData-Config erstellt: `%APPDATA%/flowshift/config.json`
- Launcher-Scripts erstellt: `start-flowshift.bat` + `flowshift-gui.bat`

### Verifikation
- Test-Commit von CT202 → erfolgreich gepusht → lokal pullbar
- `git push --dry-run` auf beiden Containern erfolgreich

## Nächste Schritte
1. FlowShift GUI starten und Peers konfigurieren (Tablet, Laptop, PC)
2. FlowShift als Windows-Service registrieren (optional, für Autostart)
3. Rust-Version bauen, sobald Rust/Cargo installiert ist (`cargo build` braucht MSVC Build Tools)
4. Milestone-Aging testen: `scripts/summarize-memory.sh --dry-run`

## Notizen
- VPS SSH-Verbindung über Tailscale (`100.118.216.77:22`) funktioniert zuverlässig
- PowerShell `<<` heredoc nicht verfügbar → SSH-Befehle müssen single-line escaped werden
- `pct push` funktioniert: Host-File → Container
