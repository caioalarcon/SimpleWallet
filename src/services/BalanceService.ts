import Pact from 'pact-lang-api';

export async function getBalance(
  account: string,
  chainId: string
): Promise<number> {
  const BASE = 'https://api.testnet.chainweb.com/chainweb/0.0';
  const networkId = 'testnet04';
  const API_HOST = `${BASE}/${networkId}/chain/${chainId}/pact`;
  const cmd = {
    pactCode: `(coin.get-balance "${account}")`,
    envData: {},
    meta: Pact.lang.mkMeta(
      account,
      chainId,
      0.00000001,
      1000,
      Math.floor(Date.now() / 1000),
      28800
    ),
    networkId,
  };
  const res = await Pact.fetch.local(cmd, API_HOST);
  return res.result?.data ?? 0;
}
