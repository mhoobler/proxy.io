import {
  HttpRequest,
  HttpResponse,
  createServer,
  ProxyIO,
} from "@mhoobler/proxy.io";
import {IncomingMessage, request} from "http";
import {join} from "path";
import {stat, createReadStream} from "fs";
import {watch} from "chokidar";

createServer((app: ProxyIO) => {
  CreateResponseHandlers(app);
  CreateFileWatcher(app);
});

const MAP_EXTENSIONS = {
  html: "text/html",
  js: "text/javascript",
};


function CreateResponseHandlers(app: ProxyIO) {
  app.on("*", AttachScripts);
  app.on("socket.io/*", () => false); // TODO: Should move this to be the default
  app.on("proxy.io/*", SendLocalFile);

  function AttachScripts(req: HttpRequest, res: HttpResponse) {
    const options = app.defaultOptions(req);
    delete options.headers["accept-encoding"];
    const search = Buffer.from("</body>");
    const replace = Buffer.from(
      "<script src='/socket.io/socket.io.js'></script>" +
      "<script src='/proxy.io/wsClient.js'></script>" +
      "</body>",
    );
    let chunks = [];

    const proxyRequest = request(options, (proxyRes: IncomingMessage) => {
      proxyRes.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      proxyRes.on("end", () => {
        const data = Buffer.concat(chunks);
        const index = data.indexOf(search);

        const newBuffer =
          index === -1
            ? data
            : Buffer.concat([
              data.subarray(0, index),
              replace,
              data.subarray(index + search.length),
            ]);

        proxyRes.headers["content-length"] = newBuffer.byteLength.toString();
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(newBuffer);
      });
    });

    req.pipe(proxyRequest, {end: true});
    return true;
  }

  function SendLocalFile(req: HttpRequest, res: HttpResponse) {
    // Assuming the file you want to send is named 'example.txt'
    const fileName =
      (req.url && req.url.split("/").slice(-1)[0]) || "index.html";
    const filePath = join(__dirname, "../static", fileName);
    const fileExt = fileName.split(".").slice(-1)[0];
    const contentType = MAP_EXTENSIONS[fileExt] || "text/plain";

    let success = true;
    // Check if the file exists
    stat(filePath, (err, stat) => {
      if (err) {
        // Handle file not found or other errors
        success = false;
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("File not found");
        return;
      }

      // Set headers for the response
      res.writeHead(200, {
        "Content-Type": contentType, // Set appropriate content type
        "Content-Length": stat.size,
      });

      // Create a readable stream to pipe the file content to the response
      const fileStream = createReadStream(filePath);

      // Pipe the file stream to the response
      fileStream.pipe(res);

      // Handle errors during streaming
      fileStream.on("error", (err: typeof Error) => {
        success = false;
        console.error("Error reading file:", err);
        res.end();
      });
    });

    return success;
  }
}

function CreateFileWatcher(app: ProxyIO) {
  const {ws} = app;
  ws.on("connect", () => console.log("connect"));
  const watcher = watch(".", {
    ignored: ["**/node_modules"],
  });

  watcher
    .on("add", (path) => console.log(`File ${path} has been added`))
    .on("change", (path) => ws.emit("change", {path}))
    .on("unlink", (path) => console.log(`File ${path} has been removed`));
}
