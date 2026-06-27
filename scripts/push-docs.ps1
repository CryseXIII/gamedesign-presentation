# Convenience script: commit and push docs/ changes from laptop
& "D:\Programme\Installierbares\Git\cmd\git.exe" -C "$PSScriptRoot/.." add -A docs/ AGENTS.md
$status = & "D:\Programme\Installierbares\Git\cmd\git.exe" -C "$PSScriptRoot/.." status --short docs/ AGENTS.md
if (-not $status) { Write-Host "Nothing to commit."; exit 0 }
$ts = (Get-Date).ToString("yyyy-MM-dd_HHmmss")
& "D:\Programme\Installierbares\Git\cmd\git.exe" -C "$PSScriptRoot/.." commit -m "docs: laptop-sync ${ts}"
& "D:\Programme\Installierbares\Git\cmd\git.exe" -C "$PSScriptRoot/.." push
Write-Host "Pushed."
