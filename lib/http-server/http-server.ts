import {
  createServer as HttpCreateServer,
  Server as NodeServer,
  ServerOptions,
  IncomingMessage,
  ServerResponse,
  RequestListener,
  RequestOptions,
  request as HttpRequest,
} from 'http';

import {
  request as HttpsRequest,
} from 'https';

import { Server as WSServer } from 'socket.io';
import { HttpsSettings } from '../config-loader/config-loader';
import { SearchScript } from '../script-store/script-store';

/* Globals */
export type Dependencies = {
  request: typeof HttpRequest | typeof HttpsRequest;
  createServer: CreateServer;
  wsServer: typeof WSServer;
};

const DEFAULT_DEPS: Dependencies = {
  request: HttpRequest,
  createServer: HttpCreateServer,
  wsServer: WSServer,
}
let Dependencies = DEFAULT_DEPS;
let Config = {
  hostName: '',
  hostPort: 0,
};

/* Utility types */
type IncomingHttpMessage = typeof IncomingMessage & 
{
  statusCode: number,
  url: string,
  end: () => void,
};

export type ServerSettings = ServerOptions<IncomingHttpMessage, typeof ServerResponse> & {
  httpPort: number,
  socketPort: number,
  hostName: string,
  hostPort: number,
  httpsSettings?: HttpsSettings,
};

export type HttpRequest = InstanceType<IncomingHttpMessage>;
export type HttpResponse = InstanceType<typeof ServerResponse>;

type CreateServer = (o: ServerOptions, r: RequestListener) => NodeServer;


export function HttpServer(
  settings: ServerSettings,
  deps: Partial<Dependencies> = Dependencies,
) {
  Dependencies = {
    ...Dependencies,
    ...deps
  };

  const { createServer, wsServer } = Dependencies;

  const { httpPort, hostName, socketPort, hostPort } = settings;
  Config = { hostName, hostPort };

  const server = createServer(settings, OnHttpRequest);
  server.listen(
    httpPort, 
    () => console.log(`Server listening: ${httpPort}, defaulting requests to ${hostName}:${hostPort}`),
  );

  const ws = new wsServer(server);
  ws.listen(socketPort);

  return { server, ws };
}

export function defaultOptions(req: HttpRequest): RequestOptions {
  return {
      hostname: Config.hostName,
      port: Config.hostPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'accept-encoding': 'gzip',
      },
  };
}

function OnHttpRequest(
    clientReq: HttpRequest,
    clientRes: HttpResponse,
) {
  const script = SearchScript(clientReq.url);
  let scriptResult = undefined;
  if(script) {
    scriptResult = script(clientReq, clientRes);
  }
  if(scriptResult) {
    // TODO: Return a better response to the client
    return;
  }

  const proxyRequest = Dependencies.request(defaultOptions(clientReq), 
    (proxyRes: IncomingMessage) => {
      const { statusCode } = (proxyRes as unknown as HttpResponse);
      clientRes.writeHead(statusCode, proxyRes.headers);
      return proxyRes.pipe(clientRes);
    }
  );
  return clientReq.pipe(proxyRequest, { end: true });
}
