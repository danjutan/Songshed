Songshed is a proof-of-concept for a grid-based guitar tabs editor.

Guitar tab editors are either inprecise (they won't let you specify exactly when a note should be hit) or cumbersome (they require classical notation knowledge or have a difficult UI to learn). Songshed divides a bar into a grid, letting you place notes as easily as filling in a table. Then, use drag-and-drop interactions to create ties, bends, and annotations, move notes and reorder bars, and [more](#implemented-features).

![A Songshed tab (just the tab portion, no chord charts) showing the Let It Be solo](readme/letitbe2.png)

You can also create chord charts. The name of the chord will be automatically detected based on your input. You can override that naming, and you can also use a chord picker to choose from a library of chords.

<img src="readme/chordpicker.png" width="400">

## Implemented Features

- Note entry (press "x" for muted note)
- Ties (hammer/pull-off, slur, slide)
- Bends (prebends, holds, release)
- Select notes by dragging
  - Delete selected notes
  - Move selected notes by dragging
  - Copy and paste selected notes
- Add and delete bars
- Drag to move new bars
- Break the bars into new lines
- Text annotations
  - drag to create
  - drag handles to resize
  - delete text to delete annotation, add new annotation rows)
- Time changes
- Change tuning (you can quickly change the tuning of a string, or expand for note + octave)
- Interactive GUI for chord diagrams - edit, reorder, rename
  - Chord name detection with [tonaljs](https://github.com/tonaljs/tonal)
  - Chord picker using [chords-db](https://github.com/tombatossals/chords-db)
- Serializing/deserializing tabs (for demo purposes; just uses a global KV store)
- Responsive options
  - Collapse empty (default): Empty columns collapse as the screen gets smaller, until they get to a minimum width. After all empty columns have reached their minimum width, the line breaks.
  - Collapse all: All columns collapse as the screen gets smaller, until they get to a minimum width. The font size of notes will shrink. After all columns have reached their minimum width, the line break.
  - Collapse subdivisions: All columns that aren't on the beat collapse (with the same behavior as the other options).
- Dark and light mode (currently works based off of your system preference)

## Planned Features

- Full account and profile system (save, view tabs, share)
- Metadata (title, description, date, etc)
- Triplets/Tuplets
- Rests
- Ghost notes
- Integration with [alphaTab](https://alphatab.net/) for playback, PDF generation, export to Guitar Pro
- Dragging chords to the bar for chord rhythm notation
- Copy chords and bars as images
- Multiple tab views (i.e., multiple guitar/bass parts for the same song)
- Mobile version

## Responsiveness

The app is fully responsive, breaking bars across lines and automatically shrinking empty columns to make more space:
![Demonstration of resizing the window and the tab updating](readme/responsive.gif)

If a tie, bend, or annotation expands across a bar, and those bars end up on separate lines, they will gracefully break:

<img src="readme/responsivebreak.gif" width="600">
