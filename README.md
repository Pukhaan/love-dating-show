# The Lover's Deck

A 72-second looping background scene for a dating show, made to play full screen on a TV or projector. Embroidered cotton look, red and blue stitched cupids, and a music-box waltz that is generated in the browser, so there is no audio file to carry around.

## Story (one loop)

1. "Love is always a good idea" is stitched in while a deck of Lover cards waits.
2. The deck is shuffled twice and fanned out.
3. Two cards are drawn. Each one shows half a heart.
4. Cupid shoots an arrow with a red thread through both halves.
5. The thread pulls the cards together into one heart: "It's a match".
6. The heart goes into a Lover envelope, which gets a blue cupid seal.
7. A second cupid carries the envelope away and the deck comes back for the next round.

The round number in the top right counts up every loop.

## Run it

Open `index.html` through any local server, then click **click to begin**.

```bash
python3 -m http.server 8931
# open http://127.0.0.1:8931
```

Keys: **F** full screen, **M** mute. The cursor hides after a few seconds.

URL options:

- `?autostart` starts without the button (sound starts on the first click)
- `?window` does not enter full screen on start
- `?t=40` starts at second 40
- `?still&t=40` freezes on second 40, useful for checking a frame

## Files

- `js/scene.js` is the timeline. Every beat sits on a bar line (2.25 s at 80 BPM).
- `js/music.js` is the waltz and sound effects (Web Audio).
- `js/pieces.js` builds the cards, arrow, heart, and envelope.
- `js/ambient.js` handles the drifting hearts and stars.
- `tools/stitch.py` turns flat ink drawings in `assets/src` into the embroidered PNGs in `assets`.
