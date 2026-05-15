# Management Access Direction

Timestamp: 2026-05-15 17:00:17 +02:00

## Context

After setting up brute-force protection, the next question was how Proxmox and future services should be exposed. The user wants public domains for selected presentation-related services, but management access should be limited to private trusted devices.

## Decision

- Treat management access and public services as separate exposure layers.
- Do not rely on DNS names alone to protect Proxmox.
- Keep Proxmox access restricted to trusted devices through network controls and later ideally a VPN-based management plane.
- Reserve public domains for explicitly public web services only.
- Plan for private internal containers that can communicate within the Proxmox environment without being generally exposed to the internet.

## Rationale

- DNS names provide naming convenience, not access control.
- A service on a public IP remains reachable unless firewall rules, source restrictions, reverse proxies, or VPN boundaries prevent access.
- This split supports both secure administration and later publication of presentation material.

## Challenges

- The user wants flexible access from multiple own devices, which is harder to maintain with static single-IP allowlists.
- Some future services need internal connectivity, while others should later be public.
- The current single-host setup needs to grow into a clearer management plane and service plane without overcomplicating the first step.

## Implementation Notes

- Updated project memory to capture the new exposure model.
- No network restriction changes were applied yet in this milestone.

## Follow-up

- Choose between short-term IP-based restriction and medium-term VPN-based management access.
- Design the first internal container network layout.
- Decide which service, if any, should be the first public domain endpoint.
