import Pact from 'pact-lang-api';
import { executeLocal } from './PactCommandService';

export async function getBalance(
  account: string,
  chainId: string
): Promise<number> {
  const networkId = 'testnet04';
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
  const res = await executeLocal(cmd, chainId, networkId);
  return res.result?.data ?? 0;
}
