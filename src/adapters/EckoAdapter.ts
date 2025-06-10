import { IWalletAdapter } from './IWalletAdapter';
import {
  detectEckoProvider,
  EckoWalletAdapter,
  IEckoProvider
} from '@kadena/wallet-adapter-ecko';

/**
 * EckoAdapter implementa IWalletAdapter para integração com eckoWALLET.
 */
export class EckoAdapter implements IWalletAdapter {
  name = 'eckoWALLET';
  private impl: EckoWalletAdapter;
  private accountName = '';
  private publicKey = '';

  private constructor(impl: EckoWalletAdapter) {
    this.impl = impl;
  }

  /** Detecta provider e cria adapter */
  static async detect(): Promise<EckoAdapter | null> {
    const provider: IEckoProvider | null = await detectEckoProvider({ silent: true });
    return provider ? new EckoAdapter(new EckoWalletAdapter({ provider })) : null;
  }

  async detect() { return true; }

  /** Conecta e obtém account / pubKey com logs detalhados. */
  async connect(): Promise<void> {
    await this.impl.connect();
    console.log('🔵 Connected to wallet');

    // 1. Tenta RPC oficial
    try {
      const info = await window.kadena.request({
        method: 'kda_requestAccount',
        params: { networkId: 'testnet04' }
      });
      console.log('🔵 RPC Account Info:', info);
      if (info?.status === 'success' && info.wallet?.account) {
        this.accountName = info.wallet.account;
        this.publicKey = info.wallet.publicKey || this.accountName.replace(/^k:/, '');
        console.log('🔵 Account & pubKey set from RPC:', this.accountName, this.publicKey);
        return;
      }
    } catch (e) {
      console.warn('⚠️ RPC request error:', e);
    }

    // 2. Fallback via impl.getActiveAccount()
    const acc = await this.impl.getActiveAccount();
    console.log('🔵 Fallback Account Info:', acc);
    if (typeof acc === 'string') {
      this.accountName = acc;
      this.publicKey = acc.replace(/^k:/, '');
    } else {
      this.accountName = acc.accountName;
      this.publicKey = acc.publicKey || acc.accountName.replace(/^k:/, '');
    }
    console.log('🔵 Account & pubKey set from fallback:', this.accountName, this.publicKey);
  }

  async getAccounts() {
    return [{ account: this.accountName, chainIds: Array.from({ length: 20 }, (_, i) => i.toString()) }];
  }

  /** Injeta signer com pubKey raw (sem k:) se ausente com logs detalhados. */
  async signTransaction(cmd: any) {
    console.log('🔵 PublicKey ao assinar:', this.publicKey);
    console.log('🔵 Comando original:', cmd);

    const signerKey = this.publicKey.replace(/^k:/, '');
    let signingCmd;

    if (cmd.cmd) {
      // Caso o cmd já esteja serializado
      const parsed = JSON.parse(cmd.cmd);
      parsed.signers = parsed.signers?.length ? parsed.signers : [{ pubKey: signerKey }];
      signingCmd = {
        ...cmd,
        cmd: JSON.stringify(parsed)
      };
    } else {
      // Caso o cmd ainda esteja como objeto
      signingCmd = {
        ...cmd,
        signers: cmd.signers?.length ? cmd.signers : [{ pubKey: signerKey }]
      };
    }

    console.log('🔵 Comando com signers corrigido:', signingCmd);

    const signed = await this.impl.signTransaction(signingCmd);
    console.log('🔵 Resposta da assinatura:', signed);
    return signed;
  }

  async sendTransaction(signed: any) {
    return await this.impl.sendTransaction(signed);
  }
}

