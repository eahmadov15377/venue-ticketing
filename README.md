# Grand ADA Theater: Interactive Ticketing

A front-end ticket-selection website for a theatre-style venue, built with plain
HTML, CSS and JavaScript (no frameworks, no build step, no backend). Visitors
explore a seating map, inspect seats to see their details and price, and build a
cart of tickets that survives a page refresh.

## Venue

| Section         | Rows  | Layout (left · centre · right) | Seats | Price  |
|-----------------|-------|--------------------------------|-------|--------|
| Premium Stalls  | A–D   | 6 · 12 · 6                     | 96    | 75 AZN |
| Standard Stalls | E–K   | 8 · 14 · 8                     | 210   | 45 AZN |
| Balcony         | L–O   | 9 · 16 · 9                     | 136   | 25 AZN |
| **Total**       |       |                                | **442** |      |

28 seats are already sold and shown as unavailable. Every seat is generated from
the JavaScript data in `js/data.js`; there is no hand-written seat markup.

## Features

- Seating map with a stage, three priced sections, aisles, row labels and entrances.
- Every seat is its own `<button>` with an accessible label that includes its
  section, row, number, price and status.
- Four seat states: **available** (section colour), **selected** (white with a
  ring), **in cart** (green with a check mark) and **unavailable** (striped grey).
- Clicking a seat only inspects it: the details panel shows its section, block,
  row, seat number, price and status. Nothing is added until **ADD TO CART** is
  pressed.
- Cart with each ticket, its price, the total and a ticket count. Tickets can be
  removed one by one or all at once, and the map updates immediately.
- The same seat can never be added twice, and sold seats can never be added.
- The cart is saved in `localStorage` and restored together with the seat states
  after a refresh. Corrupt or outdated saved data is cleaned up automatically.
- Responsive layout for desktop, tablet and phone widths down to 320px.

## Controls

### Map buttons

| Button         | Action                                      |
|----------------|---------------------------------------------|
| `+` / `−`      | Zoom in / out around the centre of the map  |
| `↑` `↓` `←` `→`| Move the view up, down, left or right       |
| Reset view     | Fit the whole venue in view and centre it   |

Zoom is limited between 80% of the fitted view and 300%, and the map can never be moved
completely out of sight. The zoom buttons are disabled at their limits.

### Keyboard

| Key            | Action                  |
|----------------|-------------------------|
| `+` or `=`     | Zoom in                 |
| `-`            | Zoom out                |
| Arrow keys     | Move the view           |
| `0`            | Reset view              |
| `Escape`       | Clear the selected seat |
| `Tab`          | Move between seats and buttons; a focused seat is panned into view |

### Mouse and touch (bonus)

- **Mouse wheel / trackpad pinch:** zoom in and out around the cursor position.
- **Click and drag:** pan the map with the mouse or a finger. A short press still
  inspects a seat; a drag that starts on a seat does not select it.

## Running

Open `index.html` in a modern browser. No server, installation or internet
connection is needed (the Google Fonts fall back to system fonts offline).

## Project structure

```
index.html          page markup and script loading order
css/style.css       styles, design tokens and responsive layout
js/data.js          venue data: sections, rows, blocks, prices, sold seats
js/venue.js         builds the seat model and renders the map from the data
js/navigation.js    zoom, movement, reset, wheel zoom and drag panning
js/storage.js       saves and restores the cart in localStorage
js/cart.js          add, remove and clear tickets, and renders the cart
js/app.js           application state, seat inspection, details panel, keyboard
```

Scripts are plain `<script>` tags loaded in the order above, so the page also
works when opened directly from the file system.

## Implementation notes

`buildSeatModel` turns the venue data into a `Map` of seat objects keyed by seat
ID (for example `G16`); each object holds the seat's section, price and status
and is the single source of truth for that seat. `renderVenue` then generates one
button per seat and links it to its object, and `updateSeatElement` keeps the
button's classes and labels in sync with the status. The cart is an array of seat
IDs: adding, removing and clearing update the seat statuses, save the array to
`localStorage` and refresh the map, details and cart through one function, so the
views cannot drift apart. On load, the saved IDs are validated and the matching
seats are marked as in cart before the first render. Map navigation applies a
single CSS transform (`translate` and `scale`) to the canvas, and the buttons,
keyboard, mouse wheel and dragging all share the same zoom and movement limits.

## Known limitations

None known.
