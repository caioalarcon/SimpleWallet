export interface IWalletAdapter {
  name: string;
  detect(): Promise<boolean>;
  connect(): Promise<void>;
  getAccounts(): Promise<{ account: string; chainIds: string[] }[]>;
  signTransaction(cmd: any): Promise<any>;
  sendTransaction(signed: any): Promise<any>;
}
