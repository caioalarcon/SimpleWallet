import { IWalletAdapter } from './IWalletAdapter';
import { detectEckoProvider, EckoWalletAdapter } from '@kadena/wallet-adapter-ecko';

/**
 * EckoAdapter implementa IWalletAdapter para integração com eckoWALLET.
 */
export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl: EckoWalletAdapter;

  /**
   * Detecta o provider eckoWALLET uma única vez.
   */
  static async detect(): Promise<EckoAdapter | null> {
    console.log('🔍 Detecting eckoWALLET provider...');
    const provider = await detectEckoProvider({ silent: true });
    if (!provider) {
      console.log('🟡 eckoWALLET provider not detected');
      return null;
    }
    console.log('🟢 eckoWALLET provider found');
    const impl = new EckoWalletAdapter({ provider });
    return new EckoAdapter(impl);
  }

  private constructor(impl: EckoWalletAdapter) {
    this.impl = impl;
  }

  /** Sempre retorna true, pois detect() já garantiu o provider. */
  async detect(): Promise<boolean> {
    return true;
  }

  /** Dispara popup de conexão da extensão e aguarda autorização. */
  async connect(): Promise<void> {
    console.log('🟢 Prompting user to connect eckoWALLET');
    await this.impl.connect();
    console.log('🟢 eckoWALLET connected');
  }

  /** Retorna a conta ativa e todos os chain IDs da rede Kadena (0-19). */
  async getAccounts(): Promise<{ account: string; chainIds: string[] }[]> {
    console.log('🔵 Getting active account from eckoWALLET');
    const acc = await this.impl.getActiveAccount();
    const accountName = typeof acc === 'string' ? acc : acc.accountName;
    const chainIds = Array.from({ length: 20 }, (_, i) => i.toString());
    console.log(`🔵 Active account: ${accountName}, chainIds: ${chainIds.join(',')}`);
    return [{ account: accountName, chainIds }];
  }

  /** Assina o comando usando eckoWALLET. */
  async signTransaction(cmd: any): Promise<any> {
    console.log('🔵 Signing transaction with eckoWALLET');
    return this.impl.sign(cmd);
  }

  /** Envia a transação assinada via eckoWALLET. */
  async sendTransaction(signed: any): Promise<any> {
    console.log('🔵 Sending transaction via eckoWALLET');
    return this.impl.send(signed);
  }
}
