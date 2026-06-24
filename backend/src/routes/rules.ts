import { IncomingMessage, ServerResponse } from "http";
import { parseCookies } from "../utils/parseCookies.js";

export default async function handleRules(req: IncomingMessage, res: ServerResponse, url: URL) {
    const cookies = parseCookies(req);
    const sessionId = cookies.session_id;
}