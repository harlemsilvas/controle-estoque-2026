const { execSync } = require('child_process');

const DEFAULT_PORT = 3000;
const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

if (!Number.isInteger(port) || port <= 0) {
  console.error('[free-port] PORT invalida:', process.env.PORT);
  process.exit(1);
}

function getListeningPidsWindows(targetPort) {
  const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
  const lines = output.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;

    const protocol = parts[0].toUpperCase();
    const localAddress = parts[1];
    const state = parts[3].toUpperCase();
    const pid = parts[4];

    if (protocol !== 'TCP') continue;
    if (state !== 'LISTENING') continue;
    if (!localAddress.endsWith(`:${targetPort}`)) continue;

    const pidNum = Number.parseInt(pid, 10);
    if (Number.isInteger(pidNum) && pidNum > 0 && pidNum !== process.pid) {
      pids.add(pidNum);
    }
  }

  return [...pids];
}

function killPidWindows(pid) {
  execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'pipe' });
}

function getListeningPidsPosix(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort}`, { encoding: 'utf8' }).trim();
    if (!output) return [];

    return output
      .split(/\r?\n/)
      .map((v) => Number.parseInt(v.trim(), 10))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

function killPidPosix(pid) {
  execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
}

function run() {
  const isWindows = process.platform === 'win32';
  const pids = isWindows ? getListeningPidsWindows(port) : getListeningPidsPosix(port);

  if (pids.length === 0) {
    console.log(`[free-port] Porta ${port} ja esta livre.`);
    return;
  }

  console.log(`[free-port] Encontrado(s) ${pids.length} processo(s) usando a porta ${port}: ${pids.join(', ')}`);

  for (const pid of pids) {
    try {
      if (isWindows) {
        killPidWindows(pid);
      } else {
        killPidPosix(pid);
      }
      console.log(`[free-port] Processo ${pid} encerrado.`);
    } catch (error) {
      console.warn(`[free-port] Falha ao encerrar PID ${pid}: ${error.message}`);
    }
  }
}

run();
