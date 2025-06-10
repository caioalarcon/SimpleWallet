import { WalletService } from './services/WalletService';
import { EckoAdapter } from './adapters/EckoAdapter';
import { SpireKeyAdapter } from './adapters/SpireKeyAdapter';
import { getBalance } from './services/BalanceService';
import { defaultPresets, Preset } from './presets';
import { executeLocal } from './services/PactCommandService';
import { formatForSigning } from './services/SigningService';
import Pact from 'pact-lang-api';

declare const ace: any;

function buildBalanceCommand(account: string, chainId: string) {
  return JSON.stringify(
    {
      pactCode: `(coin.get-balance "${account}")`,
      envData: {},
      meta: Pact.lang.mkMeta(
        account,
        chainId,
        0.00000001,
        1000,
        Math.floor(Date.now() / 1000),
        28800
      ),
      networkId: 'testnet04',
    },
    null,
    2
  );
}

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

  // Load presets from localStorage or defaults
  let presets: Preset[] = [];
  try {
    presets = JSON.parse(localStorage.getItem('pactPresets') || '[]');
  } catch {
    presets = [];
  }
  if (presets.length > 0 && typeof (presets as any)[0] === 'string') {
    presets = (presets as unknown as string[]).map((content, i) => ({
      name: `Preset ${i + 1}`,
      content
    }));
  }
  if (presets.length === 0) {
    presets = [...defaultPresets];
  }
  if (!presets[0].content || presets[0].content.includes('(coin.get-balance') || presets[0].content.trim() === '{}') {
    presets[0].content = buildBalanceCommand(account, chainIds[0]);
  }
  localStorage.setItem('pactPresets', JSON.stringify(presets));
  const savePresets = () => localStorage.setItem('pactPresets', JSON.stringify(presets));
  let currentTab = 0;

  document.getElementById('app')!.innerHTML = `
    <p><strong>Connected with:</strong> ${walletService.name}</p>
    <p><strong>Account:</strong> ${account}</p>
    <p><strong>Total Balance:</strong> ${totalBalance}</p>
    <div id="tabs"></div>
    <div id="mainRow">
      <div id="leftPane">
        <div id="editor"></div>
        <div id="buttonRow">
          <button id="signBtn">Sign</button>
          <button id="submitBtn">Local</button>
        </div>
        <pre id="signed"></pre>
      </div>
      <div id="rightPane">
        <pre id="response"></pre>
      </div>
    </div>
  `;

  const tabsEl = document.getElementById('tabs')!;
  const editor = ace.edit('editor');
  editor.setTheme('ace/theme/monokai');
  editor.session.setMode('ace/mode/json');

  const renderTabs = () => {
    tabsEl.innerHTML = '';
    presets.forEach((preset, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tab' + (idx === currentTab ? ' active' : '');
      btn.setAttribute('draggable', 'true');

      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = preset.name;
      label.addEventListener('dblclick', e => {
        e.stopPropagation();
        const newName = prompt('Rename tab', preset.name);
        if (newName) {
          preset.name = newName;
          savePresets();
          renderTabs();
        }
      });

      const close = document.createElement('span');
      close.className = 'close';
      close.textContent = '×';
      close.addEventListener('click', e => {
        e.stopPropagation();
        presets.splice(idx, 1);
        if (presets.length === 0) {
          presets.push({ name: 'Preset 1', content: '' });
          currentTab = 0;
        } else if (currentTab >= presets.length) {
          currentTab = presets.length - 1;
        }
        editor.setValue(presets[currentTab].content, -1);
        savePresets();
        renderTabs();
      });

      btn.addEventListener('click', () => {
        presets[currentTab].content = editor.getValue();
        currentTab = idx;
        editor.setValue(presets[currentTab].content, -1);
        renderTabs();
      });

      btn.addEventListener('dragstart', e => {
        e.dataTransfer?.setData('text/plain', String(idx));
      });
      btn.addEventListener('dragover', e => {
        e.preventDefault();
      });
      btn.addEventListener('drop', e => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer?.getData('text/plain') || '', 10);
        if (isNaN(from) || from === idx) return;
        const item = presets.splice(from, 1)[0];
        presets.splice(idx, 0, item);
        if (currentTab === from) {
          currentTab = idx;
        } else if (from < currentTab && idx >= currentTab) {
          currentTab--;
        } else if (from > currentTab && idx <= currentTab) {
          currentTab++;
        }
        savePresets();
        renderTabs();
      });

      btn.appendChild(label);
      btn.appendChild(close);
      tabsEl.appendChild(btn);
    });
    const add = document.createElement('button');
    add.id = 'addTab';
    add.textContent = '+';
    add.className = 'tab';
    add.addEventListener('click', () => {
      presets.push({ name: `Preset ${presets.length + 1}`, content: '' });
      currentTab = presets.length - 1;
      savePresets();
      editor.setValue('', -1);
      renderTabs();
    });
    tabsEl.appendChild(add);
  };

  renderTabs();
  editor.setValue(presets[currentTab].content, -1);
  editor.session.on('change', () => {
    if (presets[currentTab]) {
      presets[currentTab].content = editor.getValue();
      savePresets();
    }
  });

  const submit = document.getElementById('submitBtn') as HTMLButtonElement;
  const sign = document.getElementById('signBtn') as HTMLButtonElement;
  const response = document.getElementById('response') as HTMLElement;
  const signedOut = document.getElementById('signed') as HTMLElement;
  submit.addEventListener('click', async () => {
    const text = editor.getValue().trim();
    let cmd: any;
    try {
      cmd = JSON.parse(text);
    } catch (err) {
      response.textContent = `Invalid JSON: ${err}`;
      return;
    }
    if (!cmd.networkId || !/^testnet/i.test(cmd.networkId)) {
      response.textContent = 'Error: commands are allowed only on the testnet';
      return;
    }
    const chainId = cmd.meta?.chainId || chainIds[0];
    try {
      const res = await executeLocal(cmd, chainId, cmd.networkId);
      response.textContent = JSON.stringify(res, null, 2);
    } catch (err) {
      response.textContent = `Error executing command: ${err}`;
    }
  });

  sign.addEventListener('click', async () => {
    const text = editor.getValue().trim();
    let cmd: any;
    try {
      cmd = JSON.parse(text);
    } catch (err) {
      signedOut.textContent = `Invalid JSON: ${err}`;
      return;
    }
    if (!cmd.networkId || !/^testnet/i.test(cmd.networkId)) {
      signedOut.textContent = 'Error: commands are allowed only on the testnet';
      return;
    }
    try {
      const unsigned = formatForSigning(cmd);
      const signed = await walletService.signTransaction(unsigned);
      signedOut.textContent = JSON.stringify(signed, null, 2);
    } catch (err) {
      signedOut.textContent = `Error signing: ${err}`;
    }
  });
})();
