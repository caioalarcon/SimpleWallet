import { IWalletAdapter } from './IWalletAdapter';
import { eckoAdapter } from '@kadena/wallet-adapter-ecko';

export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl: any;

  static async detect(): Promise<EckoAdapter | null> {
    const provider = await eckoAdapter.detect();
    if (!provider) return null;
    const impl = await eckoAdapter.adapter(provider);
    const instance = new EckoAdapter();
    instance.impl = impl;
    return instance;
  }

  async detect() { return true; }
  async connect() { await this.impl.connect(); }
  async getAccounts() { return await this.impl.getAccounts(); }
  async signTransaction(cmd: any) { return await this.impl.sign(cmd); }
  async sendTransaction(signed: any) { return await this.impl.send(signed); }
}
