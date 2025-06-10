import { WalletService } from './services/WalletService';
import { EckoAdapter } from './adapters/EckoAdapter';
import { SpireKeyAdapter } from './adapters/SpireKeyAdapter';

(async () => {
  const adapters = [] as any[];

  const ecko = await EckoAdapter.detect();
  if (ecko) adapters.push(ecko);

  adapters.push(new SpireKeyAdapter());

  const walletService = new WalletService(adapters);
  await walletService.init();

  await walletService.connect();

  const accounts = await walletService.getAccounts();
  document.getElementById('app')!.innerHTML = `
    <p><strong>Connected with:</strong> ${walletService.name}</p>
    <p><strong>Account:</strong> ${accounts[0].account}</p>
  `;
})();
