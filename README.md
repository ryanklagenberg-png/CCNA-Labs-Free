# CCNA Sample Labs

Four interactive, browser-based CCNA practice labs. No install, no Packet Tracer, no fluff — open `index.html` and start drilling.

Each lab ships as a single self-contained HTML file with inline CSS/JS, a scenario, a working topology, three-tier progressive hints, and a completion check. Progress is saved to your browser's `localStorage`.

## What's in the sampler

| Lab | Topic | Format |
|-----|-------|--------|
| **Inter-VLAN Routing** | Router-on-a-stick with four 802.1Q subinterfaces on a Cisco ISR | Full IOS terminal simulator (mode hopping, command shorthand, `show` commands) |
| **Numbered Extended ACL** | HTTPS-only staff access to an EHR server; everything else denied | Drag-and-drop statement builder |
| **Named Extended ACL** | SMB-only finance access to a file server with `FIN-SECURE` | Drag-and-drop statement builder (order matters) |
| **Spanning Tree Protocol** | Identify the Root Bridge, every Root Port, every Designated Port, and the Blocking Port across a 4-switch ring (real BID tie-breakers) | Topology with role-label drop zones |

## How to run

**Option A — open locally.** Clone or download the repo and double-click `index.html`. Everything runs in your browser; nothing is sent anywhere.

```
git clone https://github.com/ryanklagenberg-png/CCNA-Labs-Free.git
cd <this-repo>
start "index.html"        # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

**Option B — GitHub Pages.** In repo **Settings → Pages**, set source to `main` / root, then visit `https://ryanklagenberg-png.github.io/CCNA-Labs-Free/`.

## Requirements

Any modern browser (Chrome, Edge, Firefox, Safari). No build step, no dependencies, no server, no account.

## Repo layout

```
index.html                       Portal — lists and links to the 4 labs
Inter-VLAN Routing.html          Lab 1: Router-on-a-stick
Numbered Extended ACL.html       Lab 2: Numbered extended ACL
Named Extended ACL.html          Lab 3: Named extended ACL
Spanning Tree Protocol.html      Lab 4: STP election
progress.js                      Optional localStorage progress tracker
```

## What's behind it

These four labs are a sampler from a much larger CCNA pack — 100+ browser-based labs across VLANs, ACLs, STP, OSPF, NAT/PAT, DHCP/DNS, wireless, automation, QoS, and structured troubleshooting, plus chapter walk-throughs, cheat sheets, flashcards, jeopardy, exam practice, and two companion PDFs (~280 pages combined).

**PM me for the full pack.**
