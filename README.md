# Kadena SpireKey Balance

Project to display the balance of an account on the Kadena testnet using the SpireKey extension.

## Prerequisites

- Node.js v16 or higher
- SpireKey extension installed in your browser

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser and connect the SpireKey extension to view the balance.

## Debugging wallet connection

If you encounter issues with the wallet staying on the loading state, open the browser console and copy the log output. The application now prints messages with emojis (`🟢`, `🟡`, `🔵`, `🟠`) to help trace each step of the connection process.

You can run `npm run dev` and then capture the console output after reloading the page. Share the logs so the issue can be diagnosed.

## Pact Playground

A simplified interface for writing Pact code, simulating it locally, and submitting signed transactions. After building, open `playground.html` in the `dist` folder or run the dev server and navigate to `/playground.html`.
