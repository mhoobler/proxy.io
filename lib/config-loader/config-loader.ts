import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

export type Dependencies = {
  promises: {
    readFile: (path: string) => Promise<Buffer> | typeof readFile,
    access: (path: string, enumerator: number) => Promise<boolean | void> | typeof access,
  },
  constants: { [key: string]: number } | typeof constants,
  path: {
    join: (...str: string[]) => string,
  }
}

export type HttpsSettings = {
  key: string,
  cert: string,
} | {
  pfx: string,
  passphrase: string,
};

export type ConfigSettings = {
  httpPort: number,
  socketPort: number,
  useHttps: boolean,
  httpsSettings?: HttpsSettings,
  hostName: string,
  hostPort: number,
};

export const DEFAULT_CONFIG = {
  httpPort: 3000,
  useHttps: false,
  socketPort: 3001,
  hostName: 'localhost',
  hostPort: 80,
}

const DEFAULT_DEPS: Dependencies = {
  promises: {
    access,
    readFile,
  },
  constants,
  path: {
    join,
  },
}
let dependencies = { ...DEFAULT_DEPS };

const MESSAGES = {
  "success": "Config File loaded",
  "-2": "Config File does not exist. Keeping default configuration.",
  "-13": "Permission denied for Config File. Keeping default configuration.",
  "default": "Could not read Config File (unknown reason). Keeping default configuration."
};

export async function LoadConfig(
  fileName: string = 'proxyrc.json',
  deps?: Partial<Dependencies>,
) {
  dependencies = { 
    ...dependencies,
    ...deps,
  };
  let config: ConfigSettings = { ...DEFAULT_CONFIG };

  const { promises, constants, path } = dependencies;
  const { readFile, access } = promises;

  if(!fileName) {
    return config;
  }
  const filePath = path.join(process.cwd(), fileName);

  try {
    await access(filePath, constants.R_OK);
    const JSON_file = await readFile(filePath);

    const str = JSON_file instanceof Buffer ? 
      JSON_file.toString() : 
      typeof JSON_file === 'string' ?
      JSON_file as unknown as string :
      null;

    if(str === null) {
      console.error(MESSAGES['default']);
      return config;
    }

    const parsed = JSON.parse(str);
    config = {
      httpPort: parsed.httpPort || DEFAULT_CONFIG.httpPort,
      socketPort: parsed.socketPort || DEFAULT_CONFIG.socketPort,
      useHttps: parsed.useHttps || DEFAULT_CONFIG.useHttps,
      hostName: parsed.hostName || DEFAULT_CONFIG.hostName,
      hostPort: parsed.hostPort || DEFAULT_CONFIG.hostPort,
    }
    config.httpsSettings = parsed.useHttps ?
      parsed.httpsSettings : null;
    console.log(MESSAGES['success']);
  } catch(err: unknown) {
    if((err as any).errno) {
      const { errno } = err as {errno: "-2" | "-13"};
      const printError = MESSAGES[errno] || MESSAGES['default'];
      console.log(printError);
    }
  } finally {
    return config;
  }

}
