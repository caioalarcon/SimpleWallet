import { IWalletAdapter } from './IWalletAdapter';
import { EckoWalletAdapter, detectEckoProvider } from '@kadena/wallet-adapter-ecko';

export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl!: EckoWalletAdapter;

  static async detect(): Promise<EckoAdapter | null> {
    console.log('🟢 Checking for eckoWALLET extension');
    const provider = await detectEckoProvider();
    if (!provider) {
      console.log('🟡 eckoWALLET provider not found');
      return null;
    }
    console.log('🟢 eckoWALLET provider found');
    const impl = new EckoWalletAdapter(provider);
    return new EckoAdapter(impl);
  }

  constructor(impl: EckoWalletAdapter) {
    this.impl = impl;
  }

  async detect(): Promise<boolean> {
    return true;
  }

  async connect(): Promise<void> {
    console.log('🟢 Connecting to eckoWALLET');
    await this.impl.connect();
    console.log('🟢 Connected to eckoWALLET');
  }

  async getAccounts(): Promise<{ account: string; chainIds: string[] }[]> {
    console.log('🔵 EckoAdapter: get active account');
    const acc = await this.impl.getActiveAccount();
    const accountName = typeof acc === 'string' ? acc : acc.accountName;
    console.log('🔵 Active account string:', accountName);
    return [{ account: accountName, chainIds: ['5'] }];
  }

  async signTransaction(cmd: any): Promise<any> {
    return this.impl.sign(cmd);
  }

  async sendTransaction(signed: any): Promise<any> {
    return this.impl.send(signed);
  }
}
