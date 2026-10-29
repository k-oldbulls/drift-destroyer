# Drift Destroyer

Pilot **OBI iRover**, an astronaut dog, and stop growing software drift in this browser arcade game.

[Play Drift Destroyer](https://k-oldbulls.github.io/drift-destroyer/)

## Controls

- **WASD / arrow keys:** move within the flight zone.
- **Space / hold click:** fire alternating cannons. Touch and drag also move and fire.
- **M:** launch a ready missile. Ten cannon shots recharge one missile.
- **P:** pause or resume.
- **Reset:** clear the game and return to the ready screen.
- **Sound:** toggle synthesized arcade audio.

## Gameplay

Every level adds another single-segment drift element. Spawn positions alternate sides and step down one segment height. Only lead-bug side-wall arrivals grow a drift element: +1, +2, +3 and so on. Each original drift element has its own counter; its split pieces share that counter. Followers, architecture turns, and ship respawns do not count.

Intermittent bugs temporarily become translucent and immune to shots and missiles. Orange microservice blocks turn blue while connected. Connections last at most three seconds: vertical lines turn drift bugs, and horizontal lines block vertical shots.

The red bot alternates Z and mirrored-Z patrols in successive quarters of the flight zone, starting from either side. Three bot kills enable **RADE** for thirty seconds, adding left/right lasers alongside normal vertical firing. Missile kills and unprotected ship–bot crashes count. A crash also costs one hull point.

Missiles have a circular blast radius of approximately 94.9 playfield pixels. Three translucent green, yellow and red glass bands cover the upper playfield. High scores are saved in the current browser; there is no server leaderboard or account requirement.

## Run locally

Open `index.html` directly or run:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Then open http://127.0.0.1:8766/. No dependencies or build step are needed for the browser game. Run `npm test` for gameplay checks (Node.js required).

## Publishing and desktop builds

GitHub Pages automatically deploys the browser game on pushes to `main`. Only the game HTML, JavaScript, CSS, and two sprite assets enter the deployed site.

Desktop build configuration is included separately. Run `npm ci`, then `npm run dist:mac` on macOS or `npm run dist:win` on Windows. The installer workflow can also be manually dispatched. Desktop builds are unsigned unless signing is configured. Previously generated local installers do not include these latest browser changes.

## Artwork

OBI iRover and the red robot sprites were adapted from user-supplied reference artwork using image generation to isolate them onto transparent backgrounds. Gameplay code and synthesized audio were created for this project.
