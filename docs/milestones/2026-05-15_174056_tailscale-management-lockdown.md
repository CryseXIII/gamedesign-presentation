# Tailscale Management Lockdown

Timestamp: 2026-05-15 17:40:56 +02:00

## Context

After installing Tailscale on the Proxmox host, the goal was to verify private VPN reachability and then remove broad public access to the Proxmox web interface without breaking administration.

## Decision

- Use Tailscale as the management access layer for Proxmox.
- Keep Proxmox reachable on `8006` only from localhost and the currently enrolled trusted Tailnet devices.
- Leave public service exposure for later guest workloads rather than the Proxmox host itself.

## Rationale

- The user wants management access from personal devices, not from arbitrary public IPs.
- Tailscale solves roaming-device access better than brittle public-IP allowlists.
- This creates a clean split between management and future public content hosting.

## Challenges

- The first `/etc/default/pveproxy` ACL write used incorrect shell escaping and caused `pveproxy` startup failures.
- The invalid config had to be diagnosed and repaired immediately to restore the Proxmox API proxy.

## Implementation Notes

- Verified Tailscale host state on the VPS:
  - IPv4: `100.118.216.77`
  - MagicDNS name: `vps-v2202605355759456797.tail484da1.ts.net`
- Verified `MagicDNSEnabled: true` in `tailscale status --json`.
- Verified peer devices in the same tailnet:
  - `Surface-Viktor` -> `100.65.232.37`
  - `Stealth-17-VP` -> `100.109.133.95`
- Verified peer connectivity from the VPS with `tailscale ping`.
- Configured `/etc/default/pveproxy` with host-based ACLs allowing only:
  - `127.0.0.1`
  - `::1`
  - the VPS Tailscale IPs
  - the Surface Tailscale IPs
  - the laptop Tailscale IPs
- Restarted `pveproxy` and `spiceproxy` successfully after correcting the ACL file.
- Verified behavior:
  - public `https://152.53.117.246:8006` -> no response
  - private `https://100.118.216.77:8006` -> HTTP `401 No ticket` as expected for an unauthenticated but reachable Proxmox API

## Follow-up

- Optionally replace device-IP ACL maintenance with a more VPN-native access pattern if the tailnet grows.
- Build the first presentation guest workload behind `80/443` only.
- Decide on reverse proxy and TLS handling for the public presentation domain.
