import Pact from 'pact-lang-api';

const BASE_URL = 'https://api.testnet.chainweb.com/chainweb/0.0';
const DEFAULT_NETWORK_ID = 'testnet04';

export async function executeLocal(
  cmd: any,
  chainId: string,
  networkId: string = DEFAULT_NETWORK_ID
): Promise<any> {
  const API_HOST = `${BASE_URL}/${networkId}/chain/${chainId}/pact`;
  return Pact.fetch.local(cmd, API_HOST);
}
