import { 
  LoadConfig,
  HttpServer,
  AddScript,
  defaultOptions,
} from "./imports";

function createServer(deps?: any) {
  let proxyServer = {
    on: AddScript,
    defaultOptions,
  };

  LoadConfig().then((config) => {
    const { server } = HttpServer(config, deps);
    proxyServer = {
      ...server,
      on: AddScript,
      defaultOptions,
    };
  });

  return proxyServer;
}

export { createServer };
export { HttpRequest, HttpResponse, ProxyFunction } from "./imports";
