import { IWalletAdapter } from '../adapters/IWalletAdapter';

export class WalletService {
  private adapters: IWalletAdapter[];
  private active?: IWalletAdapter;

  constructor(adapters: IWalletAdapter[]) {
    this.adapters = adapters;
  }

  async init() {
    for (const a of this.adapters) {
      if (await a.detect()) {
        this.active = a;
        return;
      }
    }
    throw new Error('No available wallet adapter');
  }

  async connect() {
    await this.active!.connect();
  }

  get name() {
    return this.active?.name;
  }

  async getAccounts() {
    return await this.active!.getAccounts();
  }

  async signAndSend(cmd: any) {
    const signed = await this.active!.signTransaction(cmd);
    return await this.active!.sendTransaction(signed);
  }
}
