import { IWalletAdapter } from '../adapters/IWalletAdapter';

export class WalletService {
  private adapters: IWalletAdapter[];
  private active?: IWalletAdapter;

  constructor(adapters: IWalletAdapter[]) {
    this.adapters = adapters;
  }

  async init() {
    console.log('🟢 Initializing WalletService');
    for (const a of this.adapters) {
      console.log(`🔵 Trying adapter: ${a.name}`);
      if (await a.detect()) {
        console.log(`🟢 Adapter ${a.name} detected`);
        this.active = a;
        return;
      } else {
        console.log(`🟡 Adapter ${a.name} not available`);
      }
    }
    throw new Error('No available wallet adapter');
  }

  async connect() {
    if (!this.active) throw new Error('No active wallet');
    console.log(`🟢 Connecting using ${this.active.name}`);
    await this.active.connect();
  }

  get name() {
    return this.active?.name;
  }

  async getAccounts() {
    if (!this.active) throw new Error('No active wallet');
    console.log('🔵 Fetching accounts');
    return await this.active.getAccounts();
  }

  async signAndSend(cmd: any) {
    if (!this.active) throw new Error('No active wallet');
    console.log('🔵 Signing transaction');
    const signed = await this.active.signTransaction(cmd);
    console.log('🔵 Sending transaction');
    return await this.active.sendTransaction(signed);
  }
}
