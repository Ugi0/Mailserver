from __future__ import annotations

import json
import logging
import socket
import traceback

import io
import os
from typing import Annotated, Dict, List, Literal, Optional, Set, Union

from fastapi import FastAPI, Header, HTTPException # type: ignore
from pydantic import BaseModel, ConfigDict, Field # type: ignore
from sievemgr import SieveManager # type: ignore

SIEVE_HOST = os.getenv("SIEVE_HOST", "mailserver")
SIEVE_PORT = int(os.getenv("SIEVE_PORT", "4190"))
SIEVE_LOGIN_TEMPLATE = os.getenv("SIEVE_LOGIN_TEMPLATE", "{email}*admin")
SIEVE_LOGIN_PASSWORD = os.getenv("SIEVE_LOGIN_PASSWORD", "")
SIEVE_SCRIPT_NAME = os.getenv("SIEVE_SCRIPT_NAME", "backend-managed")
SIEVE_API_KEY = os.getenv("SIEVE_API_KEY", "")
SIEVE_OCSP = os.getenv("SIEVE_OCSP", "false").lower() in {"1", "true", "yes"}

SIEVE_DEBUG = os.getenv("SIEVE_DEBUG", "false").lower() in {"1", "true", "yes"}
SIEVE_CONNECT_TIMEOUT = float(os.getenv("SIEVE_CONNECT_TIMEOUT", "5"))

logging.basicConfig(
    level=logging.DEBUG if SIEVE_DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("sieve-helper")

if not SIEVE_LOGIN_PASSWORD:
    raise RuntimeError("SIEVE_LOGIN_PASSWORD is not set")

app = FastAPI(title="Sieve Helper", version="1.0.0")

class AutoReplyConfig(BaseModel):
    enabled: bool = True
    subject: str = "Automatic reply"
    message: str
    days: int = 1
    from_addr: Optional[str] = None
    addresses: Optional[List[str]] = None


class FileIntoAction(BaseModel):
    type: Literal["fileinto"]
    folder: str
    create: bool = True
    stop: bool = True


class RedirectAction(BaseModel):
    type: Literal["redirect"]
    address: str
    copy: bool = True
    stop: bool = False


class KeepAction(BaseModel):
    type: Literal["keep"]
    stop: bool = False

class DiscardAction(BaseModel):
    type: Literal["discard"]
    stop: bool = True

ActionType = Annotated[
    Union[FileIntoAction, RedirectAction, KeepAction, DiscardAction],
    Field(discriminator="type"),
]


class FilterRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    field: Literal["from", "to", "cc", "subject", "header"]
    match: Literal["contains", "is", "matches"] = "contains"
    value: str
    action: ActionType
    header: Optional[str] = None


class ApplySieveRequest(BaseModel):
    email: str = Field(..., description="Target mailbox, e.g. ugi@tokkicorp.com")
    autoreply: Optional[AutoReplyConfig] = None
    filters: List[FilterRule] = Field(default_factory=list)
    script_name: Optional[str] = None
    login_username: Optional[str] = Field(
        default=None,
        description="Optional explicit ManageSieve login username. If omitted, SIEVE_LOGIN_TEMPLATE is used.",
    )


class ClearSieveRequest(BaseModel):
    email: str
    script_name: Optional[str] = None
    login_username: Optional[str] = None


class RenderSieveRequest(BaseModel):
    autoreply: Optional[AutoReplyConfig] = None
    filters: List[FilterRule] = Field(default_factory=list)

    

def sieve_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def sieve_text_block(value: str) -> str:
    """
    Render a Sieve multi-line text block.
    """
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    lines = normalized.split("\n")
    protected_lines = [".." if line == "." else line for line in lines]
    return "text:\n" + "\n".join(protected_lines) + "\n.\n;"


def build_autoreply_block(cfg: AutoReplyConfig, requires: Set[str]) -> str:
    if not cfg.enabled:
        return ""

    requires.add("vacation")

    parts: List[str] = [
        "vacation",
        f"  :days {cfg.days}",
        f"  :subject {sieve_quote(cfg.subject)}",
    ]

    if cfg.from_addr:
        parts.append(f"  :from {sieve_quote(cfg.from_addr)}")

    if cfg.addresses:
        joined = ", ".join(sieve_quote(a) for a in cfg.addresses)
        parts.append(f"  :addresses [{joined}]")

    parts.append(f"  {sieve_text_block(cfg.message)}")

    return "\n".join(parts)


def build_condition(rule: FilterRule) -> str:
    match = rule.match

    if rule.field == "from":
        return f'address :{match} "From" {sieve_quote(rule.value)}'
    if rule.field == "to":
        return f'address :{match} "To" {sieve_quote(rule.value)}'
    if rule.field == "cc":
        return f'address :{match} "Cc" {sieve_quote(rule.value)}'
    if rule.field == "subject":
        return f'header :{match} "Subject" {sieve_quote(rule.value)}'
    if rule.field == "header":
        if not rule.header:
            raise ValueError(f'Rule "{rule.name}" uses field="header" but no header name was provided')
        return f'header :{match} {sieve_quote(rule.header)} {sieve_quote(rule.value)}'

    raise ValueError(f"Unsupported field: {rule.field}")


def build_action(action: ActionType, requires: Set[str]) -> List[str]:
    lines: List[str] = []

    if action.type == "fileinto":
        requires.add("fileinto")
        if action.create:
            requires.add("mailbox")
            lines.append(f'  fileinto :create {sieve_quote(action.folder)};')
        else:
            lines.append(f'  fileinto {sieve_quote(action.folder)};')

        if action.stop:
            lines.append("  stop;")

    elif action.type == "redirect":
        if action.copy:
            requires.add("copy")
            lines.append(f'  redirect :copy {sieve_quote(action.address)};')
        else:
            lines.append(f'  redirect {sieve_quote(action.address)};')

        if action.stop:
            lines.append("  stop;")

    elif action.type == "keep":
        lines.append("  keep;")
        if action.stop:
            lines.append("  stop;")

    elif action.type == "discard":
        requires.add("discard")
        lines.append("  discard;")

        if action.stop:
            lines.append("  stop;")

    else:
        raise ValueError(f"Unsupported action type: {action.type}")

    return lines


def build_filter_blocks(rules: List[FilterRule], requires: Set[str]) -> str:
    blocks: List[str] = []

    for rule in rules:
        condition = build_condition(rule)
        action_lines = build_action(rule.action, requires)

        block = "\n".join(
            [
                f"# Rule: {rule.name}",
                f"if {condition} {{",
                *action_lines,
                "}",
            ]
        )
        blocks.append(block)

    return "\n\n".join(blocks)


def build_combined_script(
    autoreply: Optional[AutoReplyConfig],
    rules: List[FilterRule],
) -> str:
    requires: Set[str] = set()
    sections: List[str] = []

    if rules:
        filter_block = build_filter_blocks(rules, requires)
        if filter_block:
            sections.append(filter_block)

    if autoreply and autoreply.enabled:
        auto_block = build_autoreply_block(autoreply, requires)
        if auto_block:
            sections.append("# Auto reply\n" + auto_block)

    require_line = ""
    if requires:
        require_line = "require [" + ", ".join(sieve_quote(r) for r in sorted(requires)) + "];\n\n"

    body = "\n\n".join(sections)

    if body:
        body += "\n\n# Default action\nkeep;\n"
    else:
        body = "keep;\n"

    return require_line + body


def make_login_username(email: str, explicit_login_username: Optional[str]) -> str:
    if explicit_login_username:
        return explicit_login_username
    return SIEVE_LOGIN_TEMPLATE.format(email=email)


def verify_api_key(x_api_key: Optional[str]) -> None:
    if SIEVE_API_KEY and x_api_key != SIEVE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def upload_and_activate_script(
    login_username: str,
    script_name: str,
    script_content: str,
) -> None:
    preflight = preflight_manage_sieve(SIEVE_HOST, SIEVE_PORT)

    if SIEVE_DEBUG:
        logger.debug("ManageSieve preflight: %s", json.dumps(preflight, indent=2))

    if preflight.get("dns_error"):
        raise HTTPException(
            status_code=502,
            detail={
                "stage": "dns",
                "message": "Failed to resolve ManageSieve host",
                "diagnostic": preflight,
            },
        )

    if preflight.get("tcp_ok") is False:
        raise HTTPException(
            status_code=502,
            detail={
                "stage": "tcp",
                "message": "Could not connect to ManageSieve TCP port",
                "diagnostic": preflight,
            },
        )

    try:
        logger.info(
            "Connecting to ManageSieve host=%s port=%s ocsp=%s",
            SIEVE_HOST,
            SIEVE_PORT,
            SIEVE_OCSP,
        )

        try:
            mgr_ctx = SieveManager(SIEVE_HOST, SIEVE_PORT, ocsp=SIEVE_OCSP)
        except TypeError:
            mgr_ctx = SieveManager()
            mgr_ctx.open(SIEVE_HOST, SIEVE_PORT, ocsp=SIEVE_OCSP)

        with mgr_ctx as mgr:
            mgr.authenticate(login_username, SIEVE_LOGIN_PASSWORD)
            mgr.putscript(io.BytesIO(script_content.encode("utf-8")), script_name)
            mgr.setactive(script_name)

    except Exception as exc:
        logger.exception("ManageSieve upload failed")
        raise HTTPException(
            status_code=502,
            detail={
                "stage": "managesieve",
                "message": "ManageSieve upload failed",
                "exception": str(exc),
                "exception_type": type(exc).__name__,
                "diagnostic": preflight,
                "traceback": traceback.format_exc().splitlines(),
            },
        )

def resolve_host(host: str, port: int) -> list[str]:
    infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    addresses: set[str] = set()

    for info in infos:
        sockaddr = info[4]
        addresses.add(str(sockaddr[0]))

    return sorted(addresses)


def tcp_probe(host: str, port: int, timeout: float) -> None:
    with socket.create_connection((host, port), timeout=timeout):
        return


def managesieve_banner_probe(host: str, port: int, timeout: float) -> str:
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.settimeout(timeout)
        data = sock.recv(4096)
        return data.decode("utf-8", errors="replace")


def preflight_manage_sieve(host: str, port: int) -> Dict[str, object]:
    result: Dict[str, object] = {
        "host": host,
        "port": port,
    }

    try:
        result["resolved_ips"] = resolve_host(host, port)
    except Exception as exc:
        result["dns_error"] = str(exc)
        return result

    try:
        tcp_probe(host, port, SIEVE_CONNECT_TIMEOUT)
        result["tcp_ok"] = True
    except Exception as exc:
        result["tcp_ok"] = False
        result["tcp_error"] = str(exc)
        return result

    try:
        result["banner"] = managesieve_banner_probe(host, port, SIEVE_CONNECT_TIMEOUT)
    except Exception as exc:
        result["banner_error"] = str(exc)

    return result


@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {"status": "ok"}

@app.get("/v1/sieve/diagnose")
def diagnose_sieve(
    x_api_key: Optional[str] = Header(default=None),
) -> Dict[str, object]:
    verify_api_key(x_api_key)
    return preflight_manage_sieve(SIEVE_HOST, SIEVE_PORT)

@app.post("/v1/sieve/render")
def render_sieve(
    req: RenderSieveRequest,
    x_api_key: Optional[str] = Header(default=None),
) -> Dict[str, str]:
    verify_api_key(x_api_key)
    try:
        script = build_combined_script(req.autoreply, req.filters)
        return {"script": script}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/v1/sieve/apply")
def apply_sieve(
    req: ApplySieveRequest,
    x_api_key: Optional[str] = Header(default=None),
) -> Dict[str, str]:
    verify_api_key(x_api_key)

    try:
        script = build_combined_script(req.autoreply, req.filters)
        script_name = req.script_name or SIEVE_SCRIPT_NAME
        login_username = make_login_username(req.email, req.login_username)

        upload_and_activate_script(
            login_username=login_username,
            script_name=script_name,
            script_content=script,
        )

        return {
            "status": "ok",
            "email": req.email,
            "login_username": login_username,
            "script_name": script_name,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/v1/sieve/clear")
def clear_sieve(
    req: ClearSieveRequest,
    x_api_key: Optional[str] = Header(default=None),
) -> Dict[str, str]:
    verify_api_key(x_api_key)

    script_name = req.script_name or SIEVE_SCRIPT_NAME
    login_username = make_login_username(req.email, req.login_username)

    script = "keep;\n"

    upload_and_activate_script(
        login_username=login_username,
        script_name=script_name,
        script_content=script,
    )

    return {
        "status": "ok",
        "email": req.email,
        "login_username": login_username,
        "script_name": script_name,
        "message": "Replaced active script with minimal keep-only script",
    }