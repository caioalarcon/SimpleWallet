// src/main.js
import Pact from 'pact-lang-api';
import { connect } from '@kadena/spirekey-sdk';

;(async () => {
  try {
    // 1) Connect and get available address + chain IDs
    const acct = await connect('testnet04','5');
    await acct.isReady();
    const addr = acct.accountName;
    const chains = acct.chainIds; // ex: ['5']

    // 2) Configure base host up to '/pact'
    const BASE = 'https://api.testnet.chainweb.com/chainweb/0.0';
    const networkId = 'testnet04';

    // 3) Execute a `fetch.local` on each chain
    const promises = chains.map(chainId => {
      const API_HOST = `${BASE}/${networkId}/chain/${chainId}/pact`;
      // build the execCmd with ALL required fields by the library
      const cmd = {
        pactCode: `(coin.get-balance "${addr}")`,
        envData: {},
        meta: Pact.lang.mkMeta(
          addr,                     // sender
          chainId,                  // chain where it runs
          0.00000001,               // gasPrice
          1000,                     // gasLimit
          Math.floor(Date.now()/1000), // creationTime (unix secs)
          28800                     // ttl (8h)
        ),
        networkId                  // ex: "testnet04"
      };
      return Pact.fetch.local(cmd, API_HOST)
                 .then(res => res.result?.data ?? 0);
    });

    // 4) Sum balances and render
    const balances = await Promise.all(promises);
    const total    = balances.reduce((s,b) => s + b, 0);
    document.getElementById('app').innerHTML = `
      <p><strong>Account:</strong> ${addr}</p>
      <p><strong>Total Balance:</strong> ${total}</p>
    `;
  } catch (e) {
    console.error(e);
    document.getElementById('app').textContent = 'Error: ' + e.message;
  }
})();
