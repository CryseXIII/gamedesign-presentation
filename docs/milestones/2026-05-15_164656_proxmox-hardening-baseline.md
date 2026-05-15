# Proxmox Hardening Baseline

Timestamp: 2026-05-15 16:46:56 +02:00

## Context

The VPS already had Proxmox VE installed and SSH key authentication enabled. The immediate task was to inspect suspicious access patterns, decide whether there had been a compromise, and add brute-force protection before extending the infrastructure further.

## Decision

- Interpreted the observed log entries as opportunistic internet brute-force traffic, not as evidence of a successful intrusion.
- Verified that OpenCode can directly access the VPS over SSH from the local machine.
- Installed and configured `fail2ban` on the Proxmox host for both `sshd` and `proxmox`.
- Set the policy to `10` failed attempts within `1h` -> `1h` ban.

## Rationale

- The logs showed repeated failed attempts against `root` and `root@pam`, but the successful login history only showed expected IPs.
- Since OpenCode can already reach the VPS over SSH, the cleanest short-term remote workflow is to operate the host directly from this workspace instead of inventing a new control plane first.
- Brute-force protection is a low-complexity, high-value hardening step for an internet-reachable Proxmox UI.

## Challenges

- The first `fail2ban` attempt failed because `jail.local` had been created by copying `jail.conf`, and an additional `[DEFAULT]` block caused duplicate option definitions.
- The configuration had to be corrected in place and the service re-validated.

## Implementation Notes

- Verified SSH connectivity from the local workspace to `root@152.53.117.246`.
- Confirmed the environment reports `kvm` via `systemd-detect-virt`, so the Proxmox host itself is a virtual machine.
- Confirmed effective SSH settings include:
  - `passwordauthentication no`
  - `kbdinteractiveauthentication no`
  - `pubkeyauthentication yes`
  - `permitrootlogin without-password`
- Installed `fail2ban` via `apt-get`.
- Wrote `/etc/fail2ban/jail.local` with `sshd` and `proxmox` jails.
- Wrote `/etc/fail2ban/filter.d/proxmox.conf` using the Proxmox-documented `pvedaemon` regex.
- Verified active jails:
  - `sshd`
  - `proxmox`
- Verified one current Proxmox ban:
  - `141.98.11.50`
- Inspected Proxmox host topology:
  - no VMs currently listed via `qm list`
  - no containers currently listed via `pct list`
  - storage pools: `local`, `local-lvm`
  - bridge: `vmbr0` on `nic0`

## Follow-up

- Consider adding TOTP or WebAuthn for Proxmox login.
- Decide whether Proxmox UI should remain publicly reachable or be restricted by IP / later by VPN.
- Document a repeatable remote-operation pattern for local OpenCode -> VPS -> Proxmox tasks.
- Design the first service-plane workload separately from the management plane.
