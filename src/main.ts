import { WalletService } from './services/WalletService';
import { EckoAdapter } from './adapters/EckoAdapter';
import { SpireKeyAdapter } from './adapters/SpireKeyAdapter';
import { getBalance } from './services/BalanceService';
import { defaultPresets, Preset } from './presets';
import { executeLocal } from './services/PactCommandService';
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
    <div id="editor"></div>
    <button id="submitBtn">Submit</button>
    <pre id="response"></pre>
    <button id="signBtn">Sign</button>
    <p id="signedLabel" style="display:none;"></p>
    <pre id="signed"></pre>
    <button id="sendBtn">Send</button>
    <p id="sendLabel" style="display:none;"></p>
    <pre id="sendResponse"></pre>
    <div>
      <button id="pollBtn">Poll</button>
      <button id="listenBtn">Listen</button>
    </div>
    <p id="finalLabel" style="display:none;"></p>
    <pre id="finalResponse"></pre>
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
  const response = document.getElementById('response') as HTMLElement;
  const signBtn = document.getElementById('signBtn') as HTMLButtonElement;
  const signedPre = document.getElementById('signed') as HTMLElement;
  const signedLabel = document.getElementById('signedLabel') as HTMLElement;
  const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
  const sendPre = document.getElementById('sendResponse') as HTMLElement;
  const sendLabel = document.getElementById('sendLabel') as HTMLElement;
  const pollBtn = document.getElementById('pollBtn') as HTMLButtonElement;
  const listenBtn = document.getElementById('listenBtn') as HTMLButtonElement;
  const finalLabel = document.getElementById('finalLabel') as HTMLElement;
  const finalPre = document.getElementById('finalResponse') as HTMLElement;

  let signedPayload: any = null;
  let requestKey: string | null = null;
  let signedChainId = chainIds[0];
  let signedNetworkId = 'testnet04';
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

  signBtn.addEventListener('click', async () => {
    const text = editor.getValue().trim();
    let cmd: any;
    try {
      cmd = JSON.parse(text);
    } catch (err) {
      signedPre.textContent = `Invalid JSON: ${err}`;
      return;
    }
    cmd.envData = cmd.envData || {};
    signedChainId = cmd.meta?.chainId || chainIds[0];
    signedNetworkId = cmd.networkId || 'testnet04';
    cmd.meta = cmd.meta || Pact.lang.mkMeta(
      account,
      signedChainId,
      0.00000001,
      1000,
      Math.floor(Date.now() / 1000),
      28800
    );
    cmd.networkId = signedNetworkId;
    cmd.signers = cmd.signers || [{ pubKey: account }];
    try {
      signedPayload = await walletService.sign(cmd);
      signedLabel.textContent =
        'Signed transaction payload – ready to send to the blockchain';
      signedLabel.style.display = 'block';
      signedPre.textContent = JSON.stringify(signedPayload, null, 2);
    } catch (err) {
      signedPre.textContent = `Error signing command: ${err}`;
    }
  });

  sendBtn.addEventListener('click', async () => {
    if (!signedPayload) {
      sendPre.textContent = 'No signed payload available';
      return;
    }
    try {
      const res = await walletService.send(signedPayload);
      sendLabel.textContent =
        'Response from /send – transaction sent to mempool';
      sendLabel.style.display = 'block';
      sendPre.textContent = JSON.stringify(res, null, 2);
      requestKey = (res.requestKeys && res.requestKeys[0]) || res.requestKey;
    } catch (err) {
      sendPre.textContent = `Error sending transaction: ${err}`;
    }
  });

  pollBtn.addEventListener('click', async () => {
    if (!requestKey) {
      finalPre.textContent = 'No request key';
      return;
    }
    finalLabel.textContent = 'Polling until transaction is mined';
    finalLabel.style.display = 'block';
    finalPre.textContent = '';
    const API_HOST = `https://api.testnet.chainweb.com/chainweb/0.0/${signedNetworkId}/chain/${signedChainId}/pact`;
    while (true) {
      try {
        const res = await fetch(`${API_HOST}/api/v1/poll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestKeys: [requestKey] })
        }).then(r => r.json());
        if (res[requestKey]) {
          finalPre.textContent = JSON.stringify(res[requestKey], null, 2);
          break;
        }
      } catch (err) {
        finalPre.textContent = `Error polling: ${err}`;
        return;
      }
      await new Promise(r => setTimeout(r, 5000));
    }
  });

  listenBtn.addEventListener('click', async () => {
    if (!requestKey) {
      finalPre.textContent = 'No request key';
      return;
    }
    finalLabel.textContent = 'Waiting for transaction to be mined (listen)';
    finalLabel.style.display = 'block';
    finalPre.textContent = '';
    const API_HOST = `https://api.testnet.chainweb.com/chainweb/0.0/${signedNetworkId}/chain/${signedChainId}/pact`;
    try {
      const res = await fetch(`${API_HOST}/api/v1/listen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listen: requestKey })
      }).then(r => r.json());
      finalPre.textContent = JSON.stringify(res, null, 2);
    } catch (err) {
      finalPre.textContent = `Error listening: ${err}`;
    }
  });
})();
