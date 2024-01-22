import {
  LoadConfig,
  HttpServer,
  AddScript,
  defaultOptions,
  HttpDependencies,
} from "./imports";
import { Server as WSServer } from "socket.io";
import { Server as NodeServer } from "http";

type ProxyIO = {
  server: null | NodeServer;
  ws: null | WSServer;
  on: typeof AddScript;
  defaultOptions: typeof defaultOptions;
};

type AppInitCallback = (app: ProxyIO) => void;

function createServer(
  ready: AppInitCallback,
  deps?: HttpDependencies,
): ProxyIO | null {
  let app = null;
  LoadConfig().then((config) => {
    app = {
      ...(HttpServer(config, deps) as ProxyIO),
      on: AddScript,
      defaultOptions,
    };
    ready(app);
  });
  return app;
}
export { createServer, ProxyIO };
export { HttpRequest, HttpResponse, ProxyFunction } from "./imports";
