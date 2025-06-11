import { IWalletAdapter } from './IWalletAdapter';
import { connect as spireConnect } from '@kadena/spirekey-sdk';

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
    const pk = this.acct.publicKey || this.acct.accountName;
    return pk.replace(/^[kr]:/, '');
  }

  async signTransaction(cmd: any) {
    return await this.acct.sign(cmd);
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
