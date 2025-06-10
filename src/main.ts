import { WalletService } from './services/WalletService';
import { EckoAdapter } from './adapters/EckoAdapter';
import { SpireKeyAdapter } from './adapters/SpireKeyAdapter';
import { getBalance } from './services/BalanceService';

declare const ace: any;

(async () => {
  console.log('🟢 App starting');
  const adapters = [] as any[];

  // Try Ecko first
  const ecko = await EckoAdapter.detect();
  if (ecko) {
    console.log('🟢 Using eckoWALLET adapter');
    adapters.push(ecko);
  } else {
    console.log('🟡 eckoWALLET not found');
  }

  // Then SpireKey fallback
  adapters.push(new SpireKeyAdapter());

  const walletService = new WalletService(adapters);
  await walletService.init();

  console.log(`🟢 Connecting using ${walletService.name}`);
  try {
    await walletService.connect();
    console.log('🟢 Connected');
  } catch (err) {
    console.warn('⚠️ Connect failed, proceeding with accounts detection:', err);
  }

  console.log('🔵 Fetching accounts');
  const accounts = await walletService.getAccounts();
  const account = accounts[0].account;
  const chainIds = accounts[0].chainIds;

  let totalBalance = 0;
  try {
    console.log('🔵 Fetching balances for:', account);
    const balances = await Promise.all(
      chainIds.map(cid => getBalance(account, cid))
    );
    totalBalance = balances.reduce((sum, b) => sum + b, 0);
    console.log('🔵 Total balance:', totalBalance);
  } catch (err) {
    console.error('⚠️ Balance fetch error:', err);
  }

  document.getElementById('app')!.innerHTML = `
    <p><strong>Connected with:</strong> ${walletService.name}</p>
    <p><strong>Account:</strong> ${account}</p>
    <p><strong>Total Balance:</strong> ${totalBalance}</p>
    <div id="editor"></div>
    <button id="submitBtn">Submit</button>
    <pre id="response"></pre>
  `;

  const editor = ace.edit('editor');
  editor.setTheme('ace/theme/monokai');
  editor.session.setMode('ace/mode/javascript');

  const submit = document.getElementById('submitBtn') as HTMLButtonElement;
  const response = document.getElementById('response') as HTMLElement;
  submit.addEventListener('click', () => {
    const code = editor.getValue();
    response.textContent = `Command submitted:\n${code}`;
  });
})();
