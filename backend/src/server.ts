import http, { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import sendJson from "./utils/sendJson.js";

const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (!req.url || !req.headers.host) {
        return sendJson(res, 400, { error: "Bad request" });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);

      // CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        return res.end();
      }


      if (!url.pathname.startsWith("/api")) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not Found");
      }

      url.pathname = url.pathname.slice(4) || "/";

      if (url.pathname === "/healthz") {
        return sendJson(res, 200, { ok: true });
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: "Internal server error" });
    }
  }
);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

