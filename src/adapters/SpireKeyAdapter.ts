import { IWalletAdapter } from './IWalletAdapter';
import { connect as spireConnect, sign as spireSign } from '@kadena/spirekey-sdk';

export class SpireKeyAdapter implements IWalletAdapter {
  name = 'SpireKey';
  private acct: any;

  async detect() {
    console.log('🟢 SpireKey adapter available');
    return true;
  }

  async connect() {
    console.log('🟢 Connecting to SpireKey');
    this.acct = await spireConnect('testnet04', '5');
    await this.acct.isReady();
    console.log('🟢 Connected to SpireKey');
  }

  async getAccounts() {
    return [{
      account: this.acct.accountName,
      chainIds: this.acct.chainIds
    }];
  }

  async getPublicKey(): Promise<string> {
    const acc: any = this.acct;
    const keys =
      acc.accountKeys || acc.keys || acc.guard?.keys || acc.keyset?.keys;
    if (Array.isArray(keys) && keys.length > 0) {
      const k: any = keys[0];
      const pk = typeof k === 'string' ? k : k.publicKey;
      if (pk) return pk.replace(/^[kr]:/, '');
    }
    throw new Error('SpireKeyAdapter: publicKey não encontrada em acct');
  }

  async signTransaction(cmd: any) {
    const networkId = cmd.networkId || 'testnet04';
    const context = [
      {
        accountName: this.acct.accountName,
        networkId,
        chainIds: this.acct.chainIds,
      },
    ];
    const { transactions } = await spireSign([cmd], context);
    return transactions[0];
  }

  async sendTransaction(signed: any) {
    const API_HOST = 'https://api.testnet.chainweb.com/chainweb/0.0/testnet04/chain/5/pact';
    return await fetch(`${API_HOST}/api/v1/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signed)
    }).then(res => res.json());
  }
}
