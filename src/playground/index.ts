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
  localResult: document.getElementById('localResult') as HTMLElement,
  btnSign: document.getElementById('btnSign') as HTMLButtonElement,
  signedPayload: document.getElementById('signedPayload') as HTMLElement,
  btnSend: document.getElementById('btnSend') as HTMLButtonElement,
  sendResult: document.getElementById('sendResult') as HTMLElement,
  btnListen: document.getElementById('btnListen') as HTMLButtonElement,
  btnPoll: document.getElementById('btnPoll') as HTMLButtonElement,
  txResult: document.getElementById('txResult') as HTMLElement,
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

function showError(el: HTMLElement, err: any) {
  const banner = document.createElement('div');
  banner.style.color = 'red';
  banner.textContent = JSON.stringify(err);
  el.innerHTML = '';
  el.appendChild(banner);
}

function toast(msg: string) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
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
    els.localResult.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    showError(els.localResult, err);
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
    const res = await (window as any).kadena.requestSign({ pactCommand: command });
    const signedSigs = (res && res.sigs) || res;
    state.cmd = cmd;
    state.hash = hash;
    state.sigs = signedSigs;
    state.signedReady = true;
    els.btnSend.disabled = false;
    els.signedPayload.textContent = JSON.stringify({ cmd, hash, sigs: signedSigs }, null, 2);
  } catch (err: any) {
    if (err?.type === 'userCancelled') {
      toast('Signing aborted');
    } else {
      showError(els.signedPayload, err);
    }
  }
});

els.btnSend.addEventListener('click', async () => {
  if (!state.signedReady || !state.cmd || !state.hash || !state.sigs) return;
  const body = { cmd: state.cmd, hash: state.hash, sigs: state.sigs };
  try {
    const res = await post('/send', body);
    els.sendResult.textContent = JSON.stringify(res, null, 2);
    const key = res.requestKeys?.[0] || res.requestKey;
    state.requestKey = key;
    els.btnListen.disabled = !key;
    els.btnPoll.disabled = !key;
  } catch (err) {
    showError(els.sendResult, err);
  }
});

els.btnListen.addEventListener('click', async () => {
  if (!state.requestKey) return;
  try {
    const res = await post('/listen', { requestKey: state.requestKey });
    els.txResult.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    showError(els.txResult, err);
  }
});

els.btnPoll.addEventListener('click', async () => {
  if (!state.requestKey) return;
  els.btnPoll.disabled = true;
  els.btnPoll.classList.add('loading');
  try {
    let done = false;
    while (!done) {
      const res = await post('/poll', { requestKeys: [state.requestKey] });
      if (Object.keys(res).length === 0 || res[state.requestKey].result.status === 'pending') {
        await new Promise(r => setTimeout(r, 3000));
      } else {
        els.txResult.textContent = JSON.stringify(res, null, 2);
        done = true;
      }
    }
  } catch (err) {
    showError(els.txResult, err);
  } finally {
    els.btnPoll.classList.remove('loading');
    els.btnPoll.disabled = false;
  }
});

async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
