# Grand Aurora Theatre — Interactive Ticketing

A front-end ticket-selection website for a theatre-style venue, built with plain
HTML, CSS and JavaScript (no frameworks, no build step).

## Venue

| Section         | Rows  | Layout (left · centre · right) | Price  |
|-----------------|-------|--------------------------------|--------|
| Premium Stalls  | A–D   | 6 · 12 · 6                     | 75 AZN |
| Standard Stalls | E–K   | 8 · 14 · 8                     | 45 AZN |
| Balcony         | L–O   | 9 · 16 · 9                     | 25 AZN |

442 seats in total, generated from JavaScript data.

## Running

Open `index.html` in a browser. No server or installation is needed.

## Project structure

```
index.html        page markup
css/style.css     styles and design tokens
js/data.js        venue data model (sections, rows, prices, unavailable seats)
js/venue.js       builds the seat model and renders the map from data
js/app.js         application state and seat inspection
```
