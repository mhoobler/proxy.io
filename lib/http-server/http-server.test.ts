import {expect} from "chai";

import {defaultOptions, HttpRequest, HttpServer} from "./http-server";

function mockServer(spy?: any): any {
  const server: any = {};

  function createServer(options: any, onHttpRequest: any) {
    server.options = options;
    server.onHttpRequest = spy ? () => spy(onHttpRequest) : onHttpRequest;
    server.listen = (_port: number, _cb: any) => {};
    server.listeners = {};
    return server;
  }
  class MockWSServer {
    port: number | null;
    constructor() {
      this.port = null;
    }

    listen(port: number) {
      this.port = port;
    }
  }

  const mockProxRes: any = {
    statusCode: 200,
    pipe: () => {},
  };

  return {
    server,
    dependencies: {
      request: (_opts: any, cb: any) => {
        cb(mockProxRes);
      },
      createServer,
      wsServer: MockWSServer,
    },
  };
}

describe("HttpServer", () => {
  it("Mock works.", () => {
    const {server, dependencies} = mockServer();
    const settings: any = {};

    const {server: httpServer} = HttpServer(settings, dependencies);
    expect(httpServer).to.equal(server);
  });

  it("properly constructs defaultOptions", () => {
    const {dependencies} = mockServer();
    const settings: any = {
      hostName: "TestHost",
      hostPort: 1337,
    };
    const req = {
      url: "test/path",
      method: "GET",
      headers: {
        "accept-language": "en",
      },
    } as unknown as HttpRequest;
    HttpServer(settings, dependencies);
    const options = defaultOptions(req);

    expect(options.hostname).to.equal(settings.hostName);
    expect(options.port).to.equal(1337);
    expect(options.path).to.equal(req.url as string);
    expect(options.method).to.equal(req.method as string);
    expect(options.headers!["accept-language"]).to.equal("en");
  });
});
