// src/main.js
import Pact from 'pact-lang-api';
import { connect } from '@kadena/spirekey-sdk';

;(async () => {
  try {
    // 1) Conecta e pega address + chainIds disponíveis
    const acct = await connect('testnet04','5');
    await acct.isReady();
    const addr = acct.accountName;
    const chains = acct.chainIds; // ex: ['5']

    // 2) Configura host base ATÉ o '/pact'
    const BASE = 'https://api.testnet.chainweb.com/chainweb/0.0';
    const networkId = 'testnet04';

    // 3) Executa um `fetch.local` em cada chain
    const promises = chains.map(chainId => {
      const API_HOST = `${BASE}/${networkId}/chain/${chainId}/pact`;
      // monta o execCmd com TODOS os campos que a lib exige
      const cmd = {
        pactCode: `(coin.get-balance "${addr}")`,
        envData: {},
        meta: Pact.lang.mkMeta(
          addr,                     // sender
          chainId,                  // chain onde roda
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

    // 4) Soma e renderiza
    const balances = await Promise.all(promises);
    const total    = balances.reduce((s,b) => s + b, 0);
    document.getElementById('app').innerHTML = `
      <p><strong>Conta:</strong> ${addr}</p>
      <p><strong>Saldo total:</strong> ${total}</p>
    `;
  } catch (e) {
    console.error(e);
    document.getElementById('app').textContent = 'Erro: ' + e.message;
  }
})();
