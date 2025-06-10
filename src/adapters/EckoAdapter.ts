import { IWalletAdapter } from './IWalletAdapter';
import { detectEckoProvider, EckoWalletAdapter } from '@kadena/wallet-adapter-ecko';

export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl: EckoWalletAdapter;

  /**
   * Detecta se o eckoWALLET provider está disponível, aguardando até timeoutMs.
   */
  static async detect(timeoutMs = 8000): Promise<EckoAdapter | null> {
    console.log(`🔍 Detecting eckoWALLET provider (timeout ${timeoutMs}ms)...`);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // silent:true evita popups durante detecção inicial
      const provider = await detectEckoProvider({ silent: true });
      if (provider) {
        console.log('🟢 eckoWALLET provider found');
        // Manual instantiation conforme docs: passar objeto { provider }
        const impl = new EckoWalletAdapter({ provider });
        return new EckoAdapter(impl);
      }
      await new Promise(res => setTimeout(res, 200));
    }
    console.log('🟡 eckoWALLET provider not detected after timeout');
    return null;
  }

  private constructor(impl: EckoWalletAdapter) {
    this.impl = impl;
  }

  /** Sempre retorna true, pois detect() já garantiu o provider */
  async detect(): Promise<boolean> {
    return true;
  }

  /** Dispara popup de conexão e aguarda autorização */
  async connect(): Promise<void> {
    console.log('🟢 Prompting user to connect eckoWALLET');
    await this.impl.connect();
    console.log('🟢 eckoWALLET connected');
  }

  /** Retorna a conta ativa após conexão */
  async getAccounts(): Promise<{ account: string; chainIds: string[] }[]> {
    console.log('🔵 Getting active account from eckoWALLET');
    const acc = await this.impl.getActiveAccount();
    const accountName = typeof acc === 'string' ? acc : acc.accountName;
    console.log(`🔵 Active account: ${accountName}`);
    return [{ account: accountName, chainIds: ['5'] }];
  }

  async signTransaction(cmd: any): Promise<any> {
    console.log('🔵 Signing transaction with eckoWALLET');
    return this.impl.sign(cmd);
  }

  async sendTransaction(signed: any): Promise<any> {
    console.log('🔵 Sending transaction via eckoWALLET');
    return this.impl.send(signed);
  }
}
