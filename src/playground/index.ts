// Pact Playground main script

interface Defaults {
  networkId: string;
  chainId: string;
  sender: string;
  gasLimit: number;
  gasPrice: number;
  ttl: number;
}

interface State {
  cmd?: string;
  hash?: string;
  sigs?: any;
  requestKey?: string;
  signedReady: boolean;
}

const DEFAULTS_KEY = 'playgroundDefaults';

const state: State = {
  signedReady: false,
};

const els = {
  pactEditor: document.getElementById('pactEditor') as HTMLTextAreaElement,
  btnLocal: document.getElementById('btnLocal') as HTMLButtonElement,
  divLocalResult: document.getElementById('divLocalResult') as HTMLElement,
  btnSign: document.getElementById('btnSign') as HTMLButtonElement,
  divSigned: document.getElementById('divSigned') as HTMLElement,
  btnSend: document.getElementById('btnSend') as HTMLButtonElement,
  divSendResult: document.getElementById('divSendResult') as HTMLElement,
  btnListen: document.getElementById('btnListen') as HTMLButtonElement,
  btnPoll: document.getElementById('btnPoll') as HTMLButtonElement,
  divTxResult: document.getElementById('divTxResult') as HTMLElement,
  settingsBtn: document.getElementById('settingsBtn') as HTMLButtonElement,
  settingsModal: document.getElementById('settingsModal') as HTMLDivElement,
  saveSettings: document.getElementById('saveSettings') as HTMLButtonElement,
  cancelSettings: document.getElementById('cancelSettings') as HTMLButtonElement,
  inputNetwork: document.getElementById('setNetworkId') as HTMLInputElement,
  inputChain: document.getElementById('setChainId') as HTMLInputElement,
  inputSender: document.getElementById('setSender') as HTMLInputElement,
  inputGasLimit: document.getElementById('setGasLimit') as HTMLInputElement,
  inputGasPrice: document.getElementById('setGasPrice') as HTMLInputElement,
  inputTTL: document.getElementById('setTtl') as HTMLInputElement,
};

function loadDefaults(): Defaults {
  try {
    const d = JSON.parse(localStorage.getItem(DEFAULTS_KEY) || 'null');
    if (d) return d;
  } catch {}
  const defaults: Defaults = {
    networkId: 'testnet04',
    chainId: '1',
    sender: '',
    gasLimit: 1000,
    gasPrice: 0.00000001,
    ttl: 28800,
  };
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
  return defaults;
}

let defaults = loadDefaults();

function openSettings() {
  els.inputNetwork.value = defaults.networkId;
  els.inputChain.value = defaults.chainId;
  els.inputSender.value = defaults.sender;
  els.inputGasLimit.value = String(defaults.gasLimit);
  els.inputGasPrice.value = String(defaults.gasPrice);
  els.inputTTL.value = String(defaults.ttl);
  els.settingsModal.style.display = 'block';
}

function closeSettings() {
  els.settingsModal.style.display = 'none';
}

els.settingsBtn.addEventListener('click', openSettings);
els.cancelSettings.addEventListener('click', closeSettings);
els.saveSettings.addEventListener('click', () => {
  defaults = {
    networkId: els.inputNetwork.value,
    chainId: els.inputChain.value,
    sender: els.inputSender.value,
    gasLimit: Number(els.inputGasLimit.value),
    gasPrice: Number(els.inputGasPrice.value),
    ttl: Number(els.inputTTL.value),
  };
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
  closeSettings();
});

function showError(el: HTMLElement, err: any) {
  const banner = document.createElement('div');
  banner.style.color = 'red';
  banner.textContent = JSON.stringify(err);
  el.innerHTML = '';
  el.appendChild(banner);
}

async function post(endpoint: string, body: any) {
  const url = `https://api.testnet.chainweb.com/chainweb/0.0/${defaults.networkId}/chain/${defaults.chainId}/pact/api/v1${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

els.btnLocal.addEventListener('click', async () => {
  const pactCode = els.pactEditor.value;
  const meta = {
    sender: defaults.sender,
    chainId: defaults.chainId,
    gasLimit: defaults.gasLimit,
    gasPrice: defaults.gasPrice,
    ttl: defaults.ttl,
    creationTime: Math.floor(Date.now() / 1000),
  };
  const body = { pactCode, envData: {}, meta, networkId: defaults.networkId };
  try {
    const res = await post('/local', body);
    els.divLocalResult.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    showError(els.divLocalResult, err);
  }
});

els.btnSign.addEventListener('click', async () => {
  const pactCode = els.pactEditor.value;
  const meta = {
    sender: defaults.sender,
    chainId: defaults.chainId,
    gasLimit: defaults.gasLimit,
    gasPrice: defaults.gasPrice,
    ttl: defaults.ttl,
    creationTime: Math.floor(Date.now() / 1000),
  };
  const command = {
    networkId: defaults.networkId,
    payload: { exec: { code: pactCode, data: {} } },
    signers: [{ pubKey: defaults.sender }],
    meta,
  };
  const cmd = JSON.stringify(command);
  const hash = await sha256Hex(cmd);
  try {
    const sigs = await (window as any).kadena.requestSign({ pactCommand: command });
    state.cmd = cmd;
    state.hash = hash;
    state.sigs = sigs;
    state.signedReady = true;
    els.btnSend.disabled = false;
    els.divSigned.textContent = JSON.stringify({ cmd, hash, sigs }, null, 2);
  } catch (err: any) {
    if (err?.type === 'userCancelled') {
      alert('Signing aborted');
    } else {
      showError(els.divSigned, err);
    }
  }
});

els.btnSend.addEventListener('click', async () => {
  if (!state.signedReady || !state.cmd || !state.hash || !state.sigs) return;
  const body = { cmd: state.cmd, hash: state.hash, sigs: state.sigs };
  try {
    const res = await post('/send', body);
    els.divSendResult.textContent = JSON.stringify(res, null, 2);
    const key = res.requestKeys?.[0] || res.requestKey;
    state.requestKey = key;
    els.btnListen.disabled = !key;
    els.btnPoll.disabled = !key;
  } catch (err) {
    showError(els.divSendResult, err);
  }
});

els.btnListen.addEventListener('click', async () => {
  if (!state.requestKey) return;
  try {
    const res = await post('/listen', { requestKey: state.requestKey });
    els.divTxResult.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    showError(els.divTxResult, err);
  }
});

els.btnPoll.addEventListener('click', async () => {
  if (!state.requestKey) return;
  els.btnPoll.disabled = true;
  const spinner = document.createElement('span');
  spinner.textContent = '⏳';
  els.btnPoll.parentElement?.appendChild(spinner);
  try {
    let done = false;
    while (!done) {
      const res = await post('/poll', { requestKeys: [state.requestKey] });
      if (Object.keys(res).length === 0 || res[state.requestKey].result.status === 'pending') {
        await new Promise(r => setTimeout(r, 3000));
      } else {
        els.divTxResult.textContent = JSON.stringify(res, null, 2);
        done = true;
      }
    }
  } catch (err) {
    showError(els.divTxResult, err);
  } finally {
    spinner.remove();
    els.btnPoll.disabled = false;
  }
});

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
