import { IWalletAdapter } from './IWalletAdapter';
import { eckoAdapter } from '@kadena/wallet-adapter-ecko';

export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl: any;

  static async detect(): Promise<EckoAdapter | null> {
    console.log('🟢 Checking for eckoWALLET extension');
    try {
      const provider = await eckoAdapter.detect();
      if (!provider) {
        console.log('🟡 eckoWALLET not detected');
        return null;
      }
      const impl = await eckoAdapter.adapter(provider);
      const instance = new EckoAdapter();
      instance.impl = impl;
      console.log('🟢 eckoWALLET detected and adapter initialized');
      return instance;
    } catch (err) {
      console.error('🟠 Error detecting eckoWALLET', err);
      return null;
    }
  }

  async detect() { return true; }
  async connect() {
    console.log('🟢 Connecting to eckoWALLET');
    await this.impl.connect();
    console.log('🟢 Connected to eckoWALLET');
  }
  async getAccounts() { return await this.impl.getAccounts(); }
  async signTransaction(cmd: any) { return await this.impl.sign(cmd); }
  async sendTransaction(signed: any) { return await this.impl.send(signed); }
}
