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

## Multi-key accounts

When an account has multiple keys the SpireKey adapter now picks the first non `WEBAUTHN` key and injects it into the command's `signers` before signing. Ensure your commands don't set a conflicting `pubKey`.
