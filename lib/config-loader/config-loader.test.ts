import { Buffer } from 'node:buffer';
import { constants } from 'fs';
import { expect } from 'chai';
import { join } from 'path';

import { 
  LoadConfig,
  Dependencies,
  ConfigSettings,
  DEFAULT_CONFIG,
} from './config-loader';

// Disable console.log
console.log = () => {};

type MockReadFile = (path: string) => Promise<Buffer>;
type MockAccess = (path: string, enumerator: number) => Promise<boolean>;

function createMocks(testFile: unknown, testAccess: unknown): Dependencies {
  const readFile: MockReadFile = (_path) => new Promise(
    (resolve, _reject) => {
      if(typeof testFile === 'string') {
        return resolve(Buffer.from(testFile));
      }
      throw readFile;
    }
  );
  const access: MockAccess = (_path, _enumerator) => new Promise(
    (resolve, _reject) => {
      if(testAccess === true) {
        return resolve(true);
      }
      throw testAccess;
    }
  );


  return {
    promises: {
      readFile,
      access
    },
    path: {
      join,
    },
    constants: constants,
  };
}

describe('ConfigLoader', () => {
  it('Ignores `httpSettings` when `useHttps` is falsey', async () => {
    const TEST_CONFIG: Partial<ConfigSettings> = {
      httpsSettings: {
        key: 'testKey',
        cert: 'testCert'
      },
    };
    const mocks = createMocks(JSON.stringify(TEST_CONFIG), true);

    const { httpsSettings } = await LoadConfig("any", mocks)
    expect(httpsSettings).to.equal(null);
  });

  it('Overrides DEFAULT_CONFIG with TEST_CONFIG', async () => {
    const TEST_CONFIG: Partial<ConfigSettings> = {
      httpPort: 9999,
      socketPort: 999,
      useHttps: true,
      httpsSettings: {
        key: 'wiggle',
        cert: 'jiggle',
      },
      hostName: 'testhost',
      hostPort: 99,
    };
    const mocks = createMocks(JSON.stringify(TEST_CONFIG), true);

    const configSettings = await LoadConfig("any", mocks);
    expect(configSettings).to.deep.equal(TEST_CONFIG);
  });

  it('Supports pfx/passphrase and key/cert', async () => {
    // key/cert
    {
      const TEST_CONFIG: Partial<ConfigSettings> = {
        useHttps: true,
        httpsSettings: {
          key: 'testKey',
          cert: 'testCert'
        },
      };
      const mocks = createMocks(JSON.stringify(TEST_CONFIG), true);

      const { httpsSettings } = await LoadConfig("any", mocks);
      expect(httpsSettings).to.deep.equal(TEST_CONFIG.httpsSettings);
    }

    // pfx/passphrase
    {
      const TEST_CONFIG: Partial<ConfigSettings> = {
        useHttps: true,
        httpsSettings: {
          pfx: 'testPfx',
          passphrase: 'testPassphrase'
        },
      };
      const mocks = createMocks(JSON.stringify(TEST_CONFIG), true);

      const { httpsSettings } = await LoadConfig("any", mocks);
      expect(httpsSettings).to.deep.equal(TEST_CONFIG.httpsSettings);
    }
  });

  it('Partially overrides DEFAULT_CONFIG with TEST_CONFIG', async () => {
    const TEST_CONFIG = {
      httpPort: 9999,
      useHttps: true,
      socketPort: 999,
    };
    const mocks = createMocks(JSON.stringify(TEST_CONFIG), true);

    const { httpPort, useHttps, socketPort, hostName, hostPort } =
      await LoadConfig("any", mocks);

    expect(httpPort).to.equal(TEST_CONFIG.httpPort);
    expect(useHttps).to.equal(TEST_CONFIG.useHttps);
    expect(socketPort).to.equal(TEST_CONFIG.socketPort);
    expect(hostName).to.equal(DEFAULT_CONFIG.hostName);
    expect(hostPort).to.equal(DEFAULT_CONFIG.hostPort);
  });

  it('Handles Errors from `fs.promises.access` and still has DEFAULT_CONFIG', async () => {
    const TEST_CONFIG = {nothing: null};
    const mocks = createMocks(JSON.stringify(TEST_CONFIG), false);

    const configSettings = await LoadConfig("any", mocks);
    expect(configSettings).to.deep.equal(DEFAULT_CONFIG);
  });

  it('Handles Errors from `fs.promises.readFile` and still has DEFAULT_CONFIG', async () => {
    const mocks = createMocks(new Error("Help"), true);

    const configSettings = await LoadConfig("any", mocks);
    expect(configSettings).to.deep.equal(DEFAULT_CONFIG);
  });
});
