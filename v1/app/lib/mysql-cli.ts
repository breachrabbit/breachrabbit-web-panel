import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function runWithBinary(binary: string, args: string[], timeout: number) {
  return execFileAsync(binary, args, { timeout });
}

export async function runMysqlCli(args: string[], timeout = 30_000) {
  try {
    return await runWithBinary('mysql', args, timeout);
  } catch (mysqlError) {
    try {
      return await runWithBinary('mariadb', args, timeout);
    } catch {
      throw mysqlError;
    }
  }
}
