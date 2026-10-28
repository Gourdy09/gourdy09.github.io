/**
 * Reads whatever the browser will tell us about the visitor's machine.
 * Browsers hide a lot (exact CPU model, distro, real RAM, the actual terminal app),
 * so a few values are best-effort: the OS decides the terminal + shell shown.
 */

export type OSKind = 'windows' | 'macos' | 'linux' | 'chromeos' | 'android' | 'ios';

export interface SystemInfo {
  kind: OSKind;
  os: string;
  host: string;
  engine: string;
  shell: string;
  terminal: string;
  resolution: string;
  wm: string;
  cpu: string;
  gpu: string;
  memory: string | null;
  battery: string | null;
  locale: string;
  /** home directory in the OS's own style, e.g. C:\Users\ompatel */
  home: string;
  sep: '/' | '\\';
}

const USER = 'ompatel';

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | undefined> =>
  Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]).catch(() => undefined);

function detectKind(ua: string, platform: string): OSKind {
  if (/iPhone|iPad|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/CrOS/.test(ua)) return 'chromeos';
  if (/Windows/.test(ua) || /^Win/.test(platform)) return 'windows';
  if (/Mac/.test(ua) || /^Mac/.test(platform)) return 'macos';
  return 'linux';
}

function detectBrowser(ua: string): { name: string; version: string; engine: string } {
  const v = (re: RegExp) => ua.match(re)?.[1]?.split('.')[0] ?? '';
  if (/Edg\//.test(ua)) return { name: 'Microsoft Edge', version: v(/Edg\/([\d.]+)/), engine: 'Blink' };
  if (/OPR\//.test(ua)) return { name: 'Opera', version: v(/OPR\/([\d.]+)/), engine: 'Blink' };
  if (/Vivaldi\//.test(ua)) return { name: 'Vivaldi', version: v(/Vivaldi\/([\d.]+)/), engine: 'Blink' };
  if (/SamsungBrowser\//.test(ua)) return { name: 'Samsung Internet', version: v(/SamsungBrowser\/([\d.]+)/), engine: 'Blink' };
  if (/(Firefox|FxiOS)\//.test(ua)) return { name: 'Firefox', version: v(/(?:Firefox|FxiOS)\/([\d.]+)/), engine: /FxiOS/.test(ua) ? 'WebKit' : 'Gecko' };
  if (/(CriOS|Chrome)\//.test(ua)) return { name: 'Chrome', version: v(/(?:CriOS|Chrome)\/([\d.]+)/), engine: /CriOS/.test(ua) ? 'WebKit' : 'Blink' };
  if (/Safari\//.test(ua)) return { name: 'Safari', version: v(/Version\/([\d.]+)/), engine: 'WebKit' };
  return { name: 'Browser', version: '', engine: 'Unknown' };
}

/** Pulls a readable GPU name out of the (often ANGLE-wrapped) WebGL renderer string */
function detectGpu(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return 'Unknown';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    let r: string = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const angle = r.match(/^ANGLE \((.*)\)$/);
    if (angle) {
      const parts = angle[1].split(/,\s*/);
      // Windows: "NVIDIA, NVIDIA GeForce RTX 3070 (0x...) Direct3D11 ..., D3D11"; Mac: "Apple, ANGLE Metal Renderer: Apple M2, ..."
      r = parts[1] ?? parts[0];
      r = r.replace(/^ANGLE Metal Renderer:\s*/, '');
    }
    return r
      .replace(/\(0x[0-9a-f]+\)/gi, '')
      .replace(/\s*(Direct3D\d*|vs_\d_\d|ps_\d_\d|OpenGL Engine).*$/i, '')
      .replace(/\s*\(R\)|\s*\(TM\)/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+\)/g, ')')
      .trim() || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const nav = navigator as Navigator & {
    userAgentData?: { getHighEntropyValues(h: string[]): Promise<Record<string, string>>; };
    deviceMemory?: number;
    brave?: { isBrave(): Promise<boolean> };
    getBattery?: () => Promise<{ level: number; charging: boolean }>;
  };
  const ua = nav.userAgent;
  const kind = detectKind(ua, nav.platform || '');

  const hi = (await withTimeout(
    nav.userAgentData?.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model']) ?? Promise.resolve({}),
    700,
  )) ?? {};

  // ----- OS name + version -----
  const pv = hi.platformVersion ?? '';
  const pvMajor = parseInt(pv.split('.')[0] || '0', 10);
  let os = 'Linux';
  if (kind === 'windows') os = pvMajor >= 13 ? 'Windows 11' : /Windows NT 10/.test(ua) ? 'Windows 10/11' : 'Windows';
  else if (kind === 'macos') os = pv && pvMajor > 0 ? `macOS ${pv.split('.').slice(0, 2).join('.')}` : 'macOS';
  else if (kind === 'ios') os = `iOS ${(ua.match(/OS (\d+)[_.](\d+)/)?.slice(1, 3) ?? []).join('.')}`.trim();
  else if (kind === 'android') os = `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}`.trim();
  else if (kind === 'chromeos') os = 'ChromeOS';

  // ----- architecture -----
  let arch = '';
  if (hi.architecture) {
    arch = hi.architecture === 'arm' ? 'arm64' : hi.architecture === 'x86' ? (hi.bitness === '32' ? 'x86' : 'x86_64') : hi.architecture;
  } else if (/x86_64|x64|Win64|WOW64/.test(ua)) arch = 'x86_64';
  else if (/aarch64|arm64/i.test(ua)) arch = 'arm64';
  if (arch) os += ` ${arch}`;

  // ----- host / shell / terminal (decided by OS) -----
  const model = (hi.model || '').trim();
  const hostByOS: Record<OSKind, string> = {
    windows: 'Windows PC',
    macos: 'Mac',
    linux: 'Linux PC',
    chromeos: 'Chromebook',
    android: model || 'Android Device',
    ios: /iPad/.test(ua) || (nav.platform === 'MacIntel') ? 'iPad' : 'iPhone',
  };
  const shellByOS: Record<OSKind, string> = {
    windows: 'PowerShell',
    macos: 'zsh',
    linux: 'bash',
    chromeos: 'bash',
    android: 'bash',
    ios: 'zsh',
  };
  const terminalByOS: Record<OSKind, string> = {
    windows: 'Windows Terminal',
    macos: 'Terminal.app',
    linux: 'GNOME Terminal',
    chromeos: 'crosh',
    android: 'Termux',
    ios: 'a-Shell',
  };

  // ----- browser (the "WM") -----
  const b = detectBrowser(ua);
  if (b.name === 'Chrome' && (await withTimeout(nav.brave?.isBrave() ?? Promise.resolve(false), 300))) b.name = 'Brave';
  const wm = `${b.name}${b.version ? ' ' + b.version : ''}`;

  // ----- hardware -----
  const gpu = detectGpu();
  const cores = nav.hardwareConcurrency || 0;
  const appleChip = gpu.match(/Apple M\d\w*( \w+)?/)?.[0];
  const cpu = appleChip
    ? `${appleChip}${cores ? ` (${cores})` : ''}`
    : `${arch || 'CPU'}${cores ? ` (${cores} thread${cores === 1 ? '' : 's'})` : ''}`;

  const memory = nav.deviceMemory ? `${nav.deviceMemory >= 8 ? '8+' : nav.deviceMemory} GB` : null;

  const dpr = window.devicePixelRatio || 1;
  const resolution = `${Math.round(screen.width * dpr)}x${Math.round(screen.height * dpr)}`;

  let battery: string | null = null;
  const bat = await withTimeout(nav.getBattery?.() ?? Promise.resolve(undefined), 400);
  if (bat) battery = `${Math.round(bat.level * 100)}%${bat.charging ? ' (charging)' : ''}`;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = `${nav.language}${tz ? ` · ${tz}` : ''}`;

  const home = kind === 'windows' ? `C:\\Users\\${USER}` : kind === 'macos' || kind === 'ios' ? `/Users/${USER}` : `/home/${USER}`;

  return {
    kind,
    os,
    host: hostByOS[kind],
    engine: b.engine,
    shell: shellByOS[kind],
    terminal: terminalByOS[kind],
    resolution,
    wm,
    cpu,
    gpu,
    memory,
    battery,
    locale,
    home,
    sep: kind === 'windows' ? '\\' : '/',
  };
}
