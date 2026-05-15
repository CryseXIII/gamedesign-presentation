# Presentation Stack Bootstrap

Timestamp: 2026-05-15 18:38:28 +02:00

## Context

The project moved from host hardening into service architecture. The goal was to create a public presentation hosting path for a Node web application while keeping Proxmox management private.

## Decision

- Use a multi-container LXC layout instead of a single all-in-one container.
- Create a private internal container bridge for app workloads.
- Publish only a proxy container to the public through host-level NAT/forwarding.
- Use a temporary `sslip.io` hostname with real HTTPS until a permanent domain is purchased.

## Rationale

- This keeps Proxmox itself out of the public service path.
- It separates public ingress, production app hosting, and future development/build/test roles.
- It matches the intended longer-term workflow with snapshots and controlled deployment.

## Challenges

- The first NAT ruleset and first `pveproxy` access-control edit both failed due to syntax/escaping problems and had to be repaired.
- Provisioning multiple containers from local PowerShell through nested SSH and shell quoting was brittle, so provisioning files were moved into the repository and copied to the VPS for more stable execution.
- Debian package installation inside containers was heavier than expected and required breaking the setup into smaller validated steps.

## Implementation Notes

- Added private bridge `vmbr1` on the host with `10.10.10.1/24`.
- Enabled IPv4 forwarding on the host.
- Added host-level NAT and public port forwarding for `80/443` to `gd-proxy`.
- Created these LXC containers on `local-lvm`:
  - `201` `gd-proxy` -> `10.10.10.10`
  - `202` `gd-dev` -> `10.10.10.21`
  - `203` `gd-test` -> `10.10.10.22`
  - `204` `gd-build` -> `10.10.10.23`
  - `205` `gd-prod` -> `10.10.10.24`
- Installed Node.js in `gd-dev`, `gd-test`, `gd-build`, and `gd-prod`.
- Installed Caddy in `gd-proxy`.
- Deployed a first Node.js production app into `gd-prod`.
- Configured Caddy in `gd-proxy` to reverse proxy to `gd-prod`.
- Verified public HTTPS reachability on:
  - `https://gamedesign.152.53.117.246.sslip.io`

## Follow-up

- Replace the temporary `sslip.io` hostname with a real domain when purchased.
- Define the real app repository / deployment artifact flow between `gd-dev`, `gd-test`, `gd-build`, and `gd-prod`.
- Add a scripted snapshot-before-deploy process for `gd-prod`.
- Decide whether the dev/test/build containers should stay permanently running or be treated as on-demand environments.
