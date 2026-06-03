# Stable Diffusion Extension Guide

## A1111: extension access

- `AssertionError: extension access disabled because of command line flags` means the Extensions tab is locked down.
- It does **not** automatically mean extensions are not loaded.
- Runtime extensions can still be active if A1111 loaded them on startup.
- `Check for updates`, `Install`, `Apply and restart`, and restore actions are blocked until A1111 is started with `--enable-insecure-extension-access`.
- `Apply and restart` only works after that flag is present and the webui is restarted.
- In this workspace, the launcher scripts now inject `--enable-insecure-extension-access` automatically.

## A1111: what to check

1. Confirm the startup command includes `--api` if you want API clients.
2. Confirm the startup command does **not** include `--disable-all-extensions` or `--disable-extra-extensions` unless that is intentional.
3. Confirm the Extensions tab can open without the assertion.
4. To update/install extensions: open Extensions, click `Check for updates` or `Install`, then `Apply and restart`.
5. If `Apply and restart` is disabled, fix the launch flags first and restart A1111.

## OpenPose

- OpenPose in ControlNet is pose conditioning, not camera control.
- The stick figure is the body pose guide.
- To change the pose, move the joints in the OpenPose editor or feed an input image with the pose you want.
- To change framing/camera, use prompt wording, crop/source image choice, or a separate composition/control pass.

## Practical rule

- If you need a quick answer: the extension is likely active already.
- If you need to manage it: you need `--enable-insecure-extension-access`.
- If you need to know what each installed extension does, paste the extension list or a screenshot of the Extensions tab.
