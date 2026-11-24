# news-image-20261124

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/agitdut/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/agitdut/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

One image that sums up the world's news of **Tuesday 24 November 2026** — six stories that defined the day:

1. **ICJ: Myanmar guilty of Rohingya genocide** — the court's first-ever state genocide ruling; 14 nations back it.
2. **COP31 talks collapse over fossil fuels** — 90+ nations reject the draft after a 50-hour overtime in Antalya.
3. **Ukraine drones sink Russian warship** — corvette Merkury hit at Benghazi, Libya; the UN seeks a probe.
4. **Nvidia reinstates Jensen Huang as CEO** — the board acts days after his resignation; Trump weighed in.
5. **NATO warns of Russian nuclear satellite** — Moscow may launch within 60 days, allies say.
6. **US drone helps catch 'El Chapo Isidro'** — Mexico to try drug lord Fausto Isidro Meza Flores.

The program draws the image itself — a newspaper-style front page with a masthead naming the day, six story panels, each with its own pictogram, headline and one factual sub-line — using only the Node standard library. No network, no clock, no randomness: every run writes byte-identical output.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `out/entry.png` (1024×1024 PNG, well under 1 MiB).

---

<sub>Entered on [make.fun](https://make.fun/bounty/news-image-20261124)</sub>
