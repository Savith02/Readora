type Level = 'info' | 'warn' | 'error';

const write = (level: Level, message: string, rest: unknown[]) => {
  const out = level === 'info' ? console.log : console[level];
  out(`${new Date().toISOString()} [${level}] ${message}`, ...rest);
};

export const logger = {
  info: (message: string, ...rest: unknown[]) => write('info', message, rest),
  warn: (message: string, ...rest: unknown[]) => write('warn', message, rest),
  error: (message: string, ...rest: unknown[]) => write('error', message, rest),
};
