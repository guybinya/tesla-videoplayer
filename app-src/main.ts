import { TeslaStandalonePlayer } from '../src/core/tesla-standalone-player';
// Vite bundles the worker and gives us a same-origin URL we can hand to the player.
import workerUrl from '../src/worker/http-flv-worker.ts?worker&url';

const stage = document.getElementById('stage') as HTMLElement;
const urlInput = document.getElementById('url') as HTMLInputElement;
const rendererSel = document.getElementById('renderer') as HTMLSelectElement;
const fitSel = document.getElementById('fitMode') as HTMLSelectElement;
const volume = document.getElementById('volume') as HTMLInputElement;
const stateEl = document.getElementById('state') as HTMLElement;
const logEl = document.getElementById('log') as HTMLElement;
const statsEl = document.getElementById('stats') as HTMLElement;

const SAMPLE = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

function appendLog(line: string) {
  logEl.textContent += line + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

let player = createPlayer();

function createPlayer() {
  const p = new TeslaStandalonePlayer({
    container: stage,
    renderer: (rendererSel.value as 'webgl' | 'canvas2d') || 'webgl',
    fitMode: (fitSel.value as 'contain' | 'cover' | 'fill') || 'contain',
    workerUrl,
  });
  p.on('state', (value: string) => {
    stateEl.textContent = value;
  });
  p.on('error', (error: Error) => appendLog(`[error] ${error?.message || error}`));
  p.on('log', (message: string) => appendLog(`[log] ${message}`));
  p.on('firstFrame', (ms: number) => appendLog(`[first-frame] ${Math.round(ms)}ms`));
  return p;
}

document.getElementById('demo')!.addEventListener('click', () => {
  urlInput.value = SAMPLE;
});

document.getElementById('play')!.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    appendLog('[error] enter an HLS (.m3u8) or HTTP-FLV (.flv) URL');
    return;
  }
  try {
    await player.play(url);
  } catch (error: any) {
    appendLog(`[error] ${error?.message || error}`);
  }
});

document.getElementById('pause')!.addEventListener('click', async () => {
  if (stateEl.textContent === 'paused') await player.resume();
  else player.pause();
});

document.getElementById('stop')!.addEventListener('click', () => player.stop());

rendererSel.addEventListener('change', () => player.setRenderer(rendererSel.value as any));
fitSel.addEventListener('change', () => player.updateSettings({ fitMode: fitSel.value as any }));
volume.addEventListener('input', () => player.setVolume(volume.valueAsNumber));

setInterval(() => {
  try {
    statsEl.textContent = JSON.stringify(player.getStats(), null, 2);
  } catch {
    /* noop */
  }
}, 500);

// Surface WebCodecs availability up-front so the preview is informative.
if (typeof (globalThis as any).VideoDecoder === 'undefined') {
  appendLog('[warn] WebCodecs (VideoDecoder) is not available in this browser. Use a recent Chromium-based browser.');
}
