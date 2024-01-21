import { createServer } from "../dist/index.js";

//import { request } from 'https';
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
import { request } from "http";
const app = createServer({ request });

// By default, proxy.io will respond to the client with the
// server's response (server defined in proxyrc.json)
app.on("*", () => console.log("star"));

// You can also intercept the client's request, make changes to it,
// and response back to the client with the edited response
app.on("add-header/*", (req, res) => {
  console.log("add-header");
  const options = app.defaultOptions(req);
  const sendToProxy = (proxyRes) => {
    proxyRes.headers["X-Proxy"] = "true";
    res.writeHead(200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  };

  // Return a truthy value to cancel the default request
  return req.pipe(request(options, sendToProxy), { end: true });
});
