# A1111 extension access fix

## Context
- The local Stable Diffusion instance on the laptop still showed `AssertionError: extension access disabled because of command line flags` when trying to update extensions.
- The instance is managed by the laptop launcher daemon under SYSTEM, so the fix had to work in that launch path, not only in the user-facing BAT file.

## Decision
- Patch `D:\Tools\StableDiffusion\webui\webui.bat` to always pass `--enable-insecure-extension-access` into `launch.py`.
- Add `git config --global --add safe.directory "*"` before launch so extension git operations work under the SYSTEM service context.

## Rationale
- `webui.bat` is the actual entrypoint the daemon uses, so changing it affects every future SD start without touching the daemon service itself.
- Trusting the repo tree for SYSTEM removes the ownership barrier that blocks extension updates.

## Challenges
- The launcher daemon itself could not be restarted from the current permissions context.
- The daemon caches its config in memory, so editing the daemon config file alone was not enough.

## Implementation Notes
- Updated `webui.bat` to append `--enable-insecure-extension-access` to `launch.py`.
- Added a blanket Git safe.directory trust line for the SYSTEM launch context.
- Restarted A1111 through the laptop launcher daemon.
- Verified the log now shows: `Launching Web UI with arguments: --api --listen --port 7860 --opt-sdp-no-mem-attention --enable-insecure-extension-access`.

## Follow-up
- Open the Extensions tab and run `Check for updates`.
- If any extension still errors, capture the exact repo/path and tighten the Git trust rule from `*` to specific repos if needed.
