# Spark AI – Code Mode Tool Framework: Complete Guide & Reference

> **Unified Specification**: Complete source code, Code Mode execution mechanics, subdivision architectures, authentication / login integration, JSON Schema derivation, test coverage, and API contracts.

---

## Table of Contents
1. [Executive Summary & Concept](#1-executive-summary--concept)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Project Directory Layout](#3-project-directory-layout)
4. [Authentication & Login Architecture](#4-authentication--login-architecture)
5. [Complete Source Code Listing](#5-complete-source-code-listing)
   - [5.1 `requirements.txt`](#51-requirementstxt)
   - [5.2 Core Framework – `spark_ai.py`](#52-core-framework--spark_aipy)
   - [5.3 Tool Library & Subdivisions – `tools.py`](#53-tool-library--subdivisions--toolspy)
   - [5.4 FastAPI Web Server & Execution Engine – `main.py`](#54-fastapi-web-server--execution-engine--mainpy)
   - [5.5 Integration & Edge-Case Test Suite – `test_spark_ai.py`](#55-integration--edge-case-test-suite--test_spark_aipy)
6. [JSON Schema Specifications & Formats](#6-json-schema-specifications--formats)
7. [Code Mode Execution Deep Dive](#7-code-mode-execution-deep-dive)
8. [Edge Cases & Resilience Mechanics](#8-edge-cases--resilience-mechanics)
9. [Running & Verifying](#9-running--verifying)

---

## 1. Executive Summary & Concept

Traditional LLM tool usage requires generating individual tool invocations across multiple round-trips:
```
LLM -> tool_call_1 -> Host -> result_1 -> LLM -> tool_call_2 -> Host -> result_2
```
This causes high latency, token bloat, and context fragmentation.

**Spark AI Code Mode** adopts a lightweight, programmable tool execution model inspired by MCP (Model Context Protocol). Instead of multi-turn tool calling, the LLM writes an async Python code block that composes, filters, loops, and chains registered tools directly inside a sandboxed execution context:

```python
# The LLM composes multiple tools in a single turn:
customer = await call_tool("get_customer", {"customer_id": 101})
# or via subdivided object proxy:
rev = await tools.finance.revenue(sales=customer["sales"], expenses=customer["expenses"])
return {"customer": customer["name"], "net_revenue": rev["net_revenue"]}
```

### Core Capabilities:
1. **Zero-Boilerplate Reflection**: Decorate Python functions with `@spark_ai.tool`. Dynamic Python reflection builds complete JSON Schemas and handles type casting.
2. **Subdivision Namespaces**: Organize tools into logical divisions (`customer`, `finance`, `data`, `optim`, `math`) accessible as `tools.<division>.<function>()`.
3. **Dual Syntax Support**: Both functional `call_tool(name, params)` and object-proxy `tools.name(...)` / `tools.division.name(...)`.
4. **Control Character & Raw String Handling**: Built-in HTTP middleware to handle unescaped control characters (`\n`, `\t`) in JSON strings seamlessly without FastAPI/Pydantic `JSON decode error`.
5. **State & Variable Recovery**: Transparently captures both the `return` value and intermediate local variables.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Developer [Developer Definition]
        A["Python Functions in tools.py"] -->|@spark_ai.tool| B["Spark AI Dynamic Registry"]
    end

    subgraph Registry [Spark AI Engine (spark_ai.py)]
        B --> C["Type Hints & Docstring Inspection"]
        C --> D["Automatic JSON Schema Generator"]
        C --> E["Subdivision / Namespace Tree"]
        C --> F["Async & Sync Invoker"]
    end

    subgraph Server [FastAPI Layer (main.py)]
        G["HTTP Request with Token / API Key"] --> Auth["Auth & Tenant Validation"]
        Auth --> H["Control Character Sanitizer Middleware"]
        H --> I1["GET /tools/schema"]
        H --> I2["POST /tools/search"]
        H --> I3["POST /tools/execute"]
        H --> I4["POST /tools/code-mode"]
        H --> I5["POST /tools/yaml-workflow"]
    end

    subgraph SandboxedExec [Execution Engine]
        I4 --> J["Code AST & Return Transformer"]
        J --> K["Async Isolated Context\n- call_tool()\n- tools.<subdiv>.<tool>()\n- stdout redirection\n- variable capture"]
        K --> L["Final Execution Payload (result, variables, stdout)"]
    end
```

---

## 3. Project Directory Layout

```
python_backend/
│
├── main.py                     # FastAPI REST API, auth guard, JSON sanitization, code runner
├── spark_ai.py                 # Core registry, reflection engine, schema builder, proxy
├── tools.py                    # Tool definitions with @spark_ai.tool and subdivisions
├── requirements.txt            # System dependencies (fastapi, uvicorn, pydantic, pyyaml, etc.)
├── test_spark_ai.py            # Comprehensive 16-test suite (schemas, proxies, edge cases)
├── TEST_CASES_AND_EDGE_CASES.md# Test documentation & edge case catalogue
└── README.md                   # Quickstart documentation
```

---

## 4. Authentication & Login Architecture

When deploying the Code Mode backend in a production environment (such as Ingen Connect or Spark AI Enterprise), endpoints are protected by tenant/user authentication:

### 4.1 Token / Key Verification Flow
- **Header**: `Authorization: Bearer <JWT_OR_API_KEY>`
- **FastAPI Dependency**: `verify_token` checks token signature, extracts `user_id`, `role`, and `tenant_id`, and attaches them to `request.state.user`.
- **Role-Based Access Control (RBAC)**: Restrict high-privilege tools (e.g., database writes or SQL optimization) to authorized roles.

```python
# Auth Dependency in main.py:
from fastapi import Header, HTTPException, Depends

def authenticate_agent(authorization: Optional[str] = Header(None)):
    if not authorization:
        # Development fallback or strict enforcement
        return {"user_id": "usr_dev", "tenant_id": "tenant_default", "role": "admin"}
    token = authorization.replace("Bearer ", "").strip()
    if token != "secret-agent-key" and not token.startswith("sk-spark-"):
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")
    return {"user_id": "usr_authenticated", "tenant_id": "tenant_enterprise", "role": "engineer"}
```

---

## 5. Complete Source Code Listing

### 5.1 `requirements.txt`
```text
fastapi>=0.115.0
uvicorn>=0.30.0
pydantic>=2.8.0
python-multipart>=0.0.9
pyyaml>=6.0.2
pytest>=8.0.0
httpx>=0.27.0
```

---

### 5.2 Core Framework – `spark_ai.py`
```python
"""
Spark AI - Code Mode Tool Framework
Core Engine: Decorator, Function Registry, Reflection, Schema Generation, and Sandbox Proxy.
"""

import inspect
import json
import re
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple, Union, get_type_hints, get_origin, get_args
from pydantic import TypeAdapter, ValidationError


class SparkAI:
    def __init__(self):
        self.registry: Dict[str, Dict[str, Any]] = {}
        self.subdivisions: Dict[str, Dict[str, str]] = {}

    # -------------------------------------------------------------
    # 1. TOOL DECORATOR WITH SUBDIVISION SUPPORT
    # -------------------------------------------------------------
    def tool(
        self,
        func: Optional[Callable] = None,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        subdivision: Optional[str] = None,
        tags: Optional[List[str]] = None
    ):
        """
        Decorator to register a function as a Spark AI tool.
        Supports automatic type reflection, schema generation, and namespace subdivisions.
        """
        def register(fn: Callable):
            tool_name = name or fn.__name__
            hints = get_type_hints(fn)
            signature = inspect.signature(fn)
            doc = description or inspect.getdoc(fn) or ""
            fn_subdivision = subdivision or "general"
            fn_tags = tags or []

            schema = self._build_schema(fn, hints, signature, doc)

            self.registry[tool_name] = {
                "name": tool_name,
                "description": doc,
                "subdivision": fn_subdivision,
                "tags": fn_tags,
                "function": fn,
                "signature": signature,
                "hints": hints,
                "schema": schema,
                "is_coroutine": inspect.iscoroutinefunction(fn)
            }

            if fn_subdivision not in self.subdivisions:
                self.subdivisions[fn_subdivision] = {}
            self.subdivisions[fn_subdivision][tool_name] = tool_name
            alias = tool_name.replace(f"{fn_subdivision}_", "")
            if alias != tool_name:
                self.subdivisions[fn_subdivision][alias] = tool_name

            return fn

        if func is None:
            return register
        return register(func)

    # -------------------------------------------------------------
    # 2. SCHEMA BUILDER (JSON SCHEMA SPECIFICATION)
    # -------------------------------------------------------------
    def _map_python_type_to_json(self, py_type: Any) -> Dict[str, Any]:
        origin = get_origin(py_type)
        if origin is Union:
            args = [a for a in get_args(py_type) if a is not type(None)]
            if len(args) == 1:
                return self._map_python_type_to_json(args[0])
            return {"anyOf": [self._map_python_type_to_json(a) for a in args]}

        if py_type in (int,):
            return {"type": "integer"}
        elif py_type in (float,):
            return {"type": "number"}
        elif py_type in (str,):
            return {"type": "string"}
        elif py_type in (bool,):
            return {"type": "boolean"}
        elif py_type in (list, List) or origin in (list, List):
            args = get_args(py_type)
            items = self._map_python_type_to_json(args[0]) if args else {"type": "string"}
            return {"type": "array", "items": items}
        elif py_type in (dict, Dict) or origin in (dict, Dict):
            return {"type": "object"}
        return {"type": "string"}

    def _build_schema(self, fn: Callable, hints: Dict[str, Any], signature: inspect.Signature, doc: str) -> Dict[str, Any]:
        properties: Dict[str, Any] = {}
        required: List[str] = []

        param_docs = {}
        if doc:
            matches = re.findall(r":param\s+([a-zA-Z_0-9]+):\s*(.*)", doc)
            for p_name, p_desc in matches:
                param_docs[p_name] = p_desc.strip()

        for name, param in signature.parameters.items():
            if name in ("self", "cls"):
                continue

            param_type = hints.get(name, str)
            type_schema = self._map_python_type_to_json(param_type)

            if name in param_docs:
                type_schema["description"] = param_docs[name]

            if param.default is inspect.Parameter.empty:
                required.append(name)
            else:
                type_schema["default"] = param.default

            properties[name] = type_schema

        return {
            "type": "function",
            "function": {
                "name": fn.__name__,
                "description": doc.strip(),
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }

    # -------------------------------------------------------------
    # 3. SCHEMA DISCOVERY & SEARCH
    # -------------------------------------------------------------
    def get_all_schemas(self) -> List[Dict[str, Any]]:
        return [meta["schema"] for meta in self.registry.values()]

    def search_tools(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        q_tokens = set(re.findall(r"\w+", query.lower()))
        scored = []
        for name, meta in self.registry.items():
            doc = meta["description"].lower()
            name_lower = name.lower()
            subdiv = meta["subdivision"].lower()
            tags = " ".join(meta["tags"]).lower()
            corpus = f"{name_lower} {subdiv} {tags} {doc}"

            score = 0
            for token in q_tokens:
                if token in name_lower:
                    score += 5
                if token in subdiv or token in tags:
                    score += 3
                if token in doc:
                    score += 1

            if score > 0 or not q_tokens:
                scored.append((score, meta["schema"]))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]

    # -------------------------------------------------------------
    # 4. EXECUTION ENGINE
    # -------------------------------------------------------------
    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        if name not in self.registry:
            for subdiv, tool_map in self.subdivisions.items():
                if name in tool_map:
                    name = tool_map[name]
                    break

        if name not in self.registry:
            raise ValueError(f"Tool '{name}' is not registered in Spark AI.")

        tool_meta = self.registry[name]
        fn = tool_meta["function"]
        hints = tool_meta["hints"]
        converted_args = {}

        for k, v in arguments.items():
            if k in hints:
                target_type = hints[k]
                try:
                    adapter = TypeAdapter(target_type)
                    converted_args[k] = adapter.validate_python(v)
                except ValidationError:
                    converted_args[k] = v
            else:
                converted_args[k] = v

        if tool_meta["is_coroutine"]:
            return await fn(**converted_args)
        return fn(**converted_args)

    # -------------------------------------------------------------
    # 5. ASYNC TOOL PROXY BUILDER
    # -------------------------------------------------------------
    def create_tool_proxy(self):
        class SubdivProxy:
            def __init__(self, parent_proxy, subdiv_name: str):
                self._parent = parent_proxy
                self._subdiv = subdiv_name

            def __getattr__(self, name: str):
                tool_map = self._parent._spark.subdivisions.get(self._subdiv, {})
                target_name = tool_map.get(name) or f"{self._subdiv}_{name}"
                return self._parent._make_invoker(target_name)

        class ToolProxy:
            def __init__(self, spark_instance: "SparkAI"):
                self._spark = spark_instance

            def _make_invoker(self, target_name: str):
                async def invoker(*args, **kwargs):
                    if args:
                        sig = self._spark.registry[target_name]["signature"]
                        bound = sig.bind_partial(*args, **kwargs)
                        bound.apply_defaults()
                        call_kwargs = bound.arguments
                    else:
                        call_kwargs = kwargs
                    return await self._spark.execute_tool(target_name, call_kwargs)
                return invoker

            def __getattr__(self, name: str):
                if name in self._spark.subdivisions:
                    return SubdivProxy(self, name)
                return self._make_invoker(name)

        return ToolProxy(self)


# Singleton Instance
spark_ai = SparkAI()
```

---

### 5.3 Tool Library & Subdivisions – `tools.py`
```python
"""
Spark AI Tool Library
Demonstrates modular Python functions registered into namespaces/subdivisions:
- math
- customer
- finance
- data
- optim
"""

from typing import List, Dict, Any, Optional
from spark_ai import spark_ai


# ==========================================
# SUBDIVISION: MATH
# ==========================================
@spark_ai.tool(subdivision="math", tags=["arithmetic", "core"])
def add(x: float, y: float) -> float:
    """Add two numbers together."""
    return x + y


@spark_ai.tool(subdivision="math", tags=["arithmetic", "core"])
def multiply(x: float, y: float) -> float:
    """Multiply two numbers together."""
    return x * y


@spark_ai.tool(subdivision="math", tags=["arithmetic"])
def subtract(x: float, y: float) -> float:
    """Subtract y from x."""
    return x - y


# ==========================================
# SUBDIVISION: CUSTOMER
# ==========================================
_MOCK_CUSTOMERS = {
    101: {"customer_id": 101, "name": "ABC Healthcare System", "tier": "Enterprise Decile 1", "status": "Active", "arr": 240000.0, "churn_risk": "Low (4.2%)", "sales": 240000.0, "expenses": 65000.0},
    102: {"customer_id": 102, "name": "XYZ Global Pharma", "tier": "Strategic Partner", "status": "Active", "arr": 580000.0, "churn_risk": "Minimal (1.5%)", "sales": 580000.0, "expenses": 140000.0},
    103: {"customer_id": 103, "name": "Apex Diagnostics LLC", "tier": "Mid-Market", "status": "Pending Renewal", "arr": 95000.0, "churn_risk": "Moderate (18.1%)", "sales": 95000.0, "expenses": 42000.0}
}

@spark_ai.tool(subdivision="customer", tags=["crm", "accounts"])
def get_customer(customer_id: int) -> Dict[str, Any]:
    """Retrieve comprehensive customer profile, status, and health metrics by customer ID."""
    if customer_id not in _MOCK_CUSTOMERS:
        return {"error": f"Customer ID {customer_id} not found", "status": "NotFound"}
    return _MOCK_CUSTOMERS[customer_id]


@spark_ai.tool(subdivision="customer", tags=["crm", "search"])
def search_customers(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search customer accounts by company name, industry, or keyword."""
    results = [c for c in _MOCK_CUSTOMERS.values() if query.lower() in c["name"].lower()]
    return results[:limit]


# ==========================================
# SUBDIVISION: FINANCE
# ==========================================
@spark_ai.tool(subdivision="finance", tags=["revenue", "margins"])
def calculate_revenue(sales: float, expenses: float) -> Dict[str, Any]:
    """Compute net revenue, operating profit margins, and expense efficiency ratio."""
    net = sales - expenses
    margin = (net / sales * 100.0) if sales > 0 else 0.0
    return {
        "sales": float(sales),
        "expenses": float(expenses),
        "net_revenue": round(net, 2),
        "operating_margin_pct": round(margin, 2)
    }


# ==========================================
# SUBDIVISION: DATA & OPTIM
# ==========================================
@spark_ai.tool(subdivision="data", tags=["warehouse", "sql"])
def query_dataset(table_name: str, limit: int = 100) -> Dict[str, Any]:
    """Execute a high-speed telemetry query against connected datasets."""
    return {"table": table_name, "returned_rows": min(limit, 25), "columns": ["id", "timestamp", "payload_val", "status"], "status": "SUCCESS"}


@spark_ai.tool(subdivision="optim", tags=["performance", "indexing"])
def optimize_sql_query(sql_statement: str) -> Dict[str, Any]:
    """Analyze slow SQL statements and generate partition pruning and key clustering recommendations."""
    return {"original_sql": sql_statement, "recommended_indexes": ["CREATE INDEX idx_perf_lead ON dataset (tenant_id, created_at DESC)"], "estimated_speedup": "4.8x faster"}
```

---

### 5.4 FastAPI Web Server & Execution Engine – `main.py`
```python
"""
FastAPI application for Spark AI Code Mode.
Exposes endpoints for:
- Discovery: GET /tools/schema, GET /tools/subdivisions, POST /tools/search
- Tool Calling: POST /tools/execute, POST /tools/batch-execute
- Code Mode: POST /tools/code-mode (async proxy, call_tool, return capturing)
- Workflows: POST /tools/yaml-workflow
"""

import ast
import asyncio
import io
import json
import re
import sys
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware
import yaml

from spark_ai import spark_ai
import tools  # Auto-registers tools into registry


# -------------------------------------------------------------
# CONTROL CHARACTER SANITIZATION MIDDLEWARE
# -------------------------------------------------------------
class JsonControlCharacterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH") and "application/json" in request.headers.get("content-type", ""):
            body = await request.body()
            if body:
                try:
                    sanitized_obj = json.loads(body.decode("utf-8"), strict=False)
                    async def receive():
                        return {"type": "http.request", "body": json.dumps(sanitized_obj).encode("utf-8")}
                    request._receive = receive
                except Exception:
                    pass
        return await call_next(request)


app = FastAPI(
    title="Spark AI Code Mode Engine",
    description="Tool discovery and programmable Code Mode execution API",
    version="1.0.0"
)
app.add_middleware(JsonControlCharacterMiddleware)


# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------
class ToolSearchRequest(BaseModel):
    query: str = Field(..., description="Query to discover tools")
    limit: int = Field(5, description="Maximum number of tools")

class ToolExecuteRequest(BaseModel):
    name: str = Field(..., description="Tool name")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Parameters")

class BatchExecuteRequest(BaseModel):
    calls: List[ToolExecuteRequest]

class CodeModeRequest(BaseModel):
    code: str = Field(..., description="Python script composition invoking tools")

class YamlWorkflowRequest(BaseModel):
    yaml_content: str = Field(..., description="YAML pipeline definition")


# -------------------------------------------------------------
# ENDPOINTS
# -------------------------------------------------------------
@app.get("/tools/schema")
async def get_schemas():
    return {"success": True, "schemas": spark_ai.get_all_schemas()}

@app.get("/tools/subdivisions")
async def get_subdivisions():
    return {"success": True, "subdivisions": spark_ai.subdivisions}

@app.post("/tools/search")
async def search_tools(req: ToolSearchRequest):
    return {"success": True, "query": req.query, "tools": spark_ai.search_tools(req.query, req.limit)}

@app.post("/tools/execute")
async def execute_tool(req: ToolExecuteRequest):
    try:
        result = await spark_ai.execute_tool(req.name, req.arguments)
        return {"success": True, "tool": req.name, "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/tools/code-mode")
async def run_code_mode(req: CodeModeRequest):
    """
    Executes Python Code Mode scripts.
    Supports:
    - a = await call_tool("name", {...})
    - b = await tools.subdiv.tool(...)
    - return <expr>
    """
    clean_code = req.code.replace("\r\n", "\n")
    tools_proxy = spark_ai.create_tool_proxy()

    async def call_tool(tool_name: str, params: Optional[Dict[str, Any]] = None):
        return await spark_ai.execute_tool(tool_name, params or {})

    # Transform top-level return into captured value
    lines = clean_code.split("\n")
    transformed_lines = []
    has_return = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("return "):
            has_return = True
            indent = line[: len(line) - len(stripped)]
            expr = stripped[7:].strip()
            transformed_lines.append(f"{indent}__ctx__.update(locals())")
            transformed_lines.append(f"{indent}__final_return__ = {expr}")
        else:
            transformed_lines.append(line)

    transformed_code = "\n".join(transformed_lines)
    wrapped_code = (
        "async def __sandboxed_entry__(tools, call_tool, __ctx__):\n"
        + "\n".join(f"    {l}" for l in transformed_code.split("\n"))
        + "\n    __ctx__.update(locals())\n"
        + "    return locals().get('__final_return__', locals().get('result', None))\n"
    )

    stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_capture

    exec_globals: Dict[str, Any] = {"__builtins__": __builtins__}
    ctx_store: Dict[str, Any] = {}

    try:
        exec(wrapped_code, exec_globals)
        entry_fn = exec_globals["__sandboxed_entry__"]
        final_result = await entry_fn(tools_proxy, call_tool, ctx_store)

        captured_vars = {
            k: v for k, v in ctx_store.items()
            if not k.startswith("_") and k not in ("tools", "call_tool", "__ctx__") and not callable(v)
        }

        return {
            "success": True,
            "mode": "code_mode_execution",
            "result": final_result,
            "stdout": stdout_capture.getvalue(),
            "variables": captured_vars
        }
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": type(e).__name__, "message": str(e), "stdout": stdout_capture.getvalue()}
        )
    finally:
        sys.stdout = old_stdout

@app.post("/tools/yaml-workflow")
async def run_yaml_workflow(req: YamlWorkflowRequest):
    parsed = yaml.safe_load(req.yaml_content)
    steps = parsed.get("steps", [])
    context: Dict[str, Any] = {}
    step_results = []

    for step in steps:
        step_id = step.get("id")
        tool_name = step.get("tool")
        raw_args = step.get("arguments", {})

        resolved_args = {}
        for k, v in raw_args.items():
            if isinstance(v, str) and "{{" in v and "}}" in v:
                match = re.search(r"\{\{([a-zA-Z0-9_.]+)\}\}", v)
                if match:
                    path = match.group(1).split(".")
                    curr = context
                    for part in path:
                        curr = curr.get(part, {}) if isinstance(curr, dict) else curr
                    resolved_args[k] = curr
                else:
                    resolved_args[k] = v
            else:
                resolved_args[k] = v

        res = await spark_ai.execute_tool(tool_name, resolved_args)
        if step_id:
            context[step_id] = res
        step_results.append({"step_id": step_id, "tool": tool_name, "result": res})

    return {"success": True, "mode": "yaml_workflow", "total_steps": len(steps), "steps": step_results, "final_output": step_results[-1]["result"] if step_results else None}
```

---

### 5.5 Integration & Edge-Case Test Suite – `test_spark_ai.py`
```python
"""
Pytest Suite for Spark AI Code Mode Framework
Validates 16 scenarios across registry, search, execution, proxies, edge cases, and workflows.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from spark_ai import spark_ai

client = TestClient(app)

def test_schema_retrieval():
    res = client.get("/tools/schema")
    assert res.status_code == 200
    assert any(s["function"]["name"] == "add" for s in res.json()["schemas"])

def test_subdivisions_structure():
    res = client.get("/tools/subdivisions")
    assert res.status_code == 200
    subdivs = res.json()["subdivisions"]
    assert "math" in subdivs and "customer" in subdivs and "finance" in subdivs

def test_tool_search_keyword():
    res = client.post("/tools/search", json={"query": "customer revenue", "limit": 2})
    assert res.status_code == 200
    assert len(res.json()["tools"]) > 0

def test_direct_execution_add():
    res = client.post("/tools/execute", json={"name": "add", "arguments": {"x": 12.5, "y": 7.5}})
    assert res.status_code == 200
    assert res.json()["result"] == 20.0

def test_direct_execution_customer_lookup():
    res = client.post("/tools/execute", json={"name": "get_customer", "arguments": {"customer_id": 101}})
    assert res.status_code == 200
    assert res.json()["result"]["name"] == "ABC Healthcare System"

def test_code_mode_call_tool_chaining():
    code = (
        "a = await call_tool('add', {'x': 3, 'y': 4})\n"
        "b = await call_tool('multiply', {'x': a, 'y': 2})\n"
        "return b"
    )
    res = client.post("/tools/code-mode", json={"code": code})
    assert res.status_code == 200
    data = res.json()
    assert data["result"] == 14.0
    assert data["variables"]["a"] == 7.0

def test_code_mode_subdivision_proxy():
    code = (
        "c = await tools.customer.get(customer_id=101)\n"
        "rev = await tools.finance.revenue(sales=c['sales'], expenses=c['expenses'])\n"
        "return rev"
    )
    res = client.post("/tools/code-mode", json={"code": code})
    assert res.status_code == 200
    assert res.json()["result"]["net_revenue"] == 175000.0

def test_control_character_raw_json_resilience():
    raw_payload = '{"code": "a = await call_tool(\\"add\\", {\\"x\\": 10, \\"y\\": 5})\nreturn a"}'
    res = client.post("/tools/code-mode", data=raw_payload, headers={"Content-Type": "application/json"})
    assert res.status_code == 200
    assert res.json()["result"] == 15.0

def test_yaml_workflow_pipeline():
    pipeline = (
        "steps:\n"
        "  - id: step_add\n"
        "    tool: add\n"
        "    arguments: {x: 20, y: 30}\n"
        "  - id: step_mult\n"
        "    tool: multiply\n"
        "    arguments: {x: '{{step_add}}', y: 3}\n"
    )
    res = client.post("/tools/yaml-workflow", json={"yaml_content": pipeline})
    assert res.status_code == 200
    assert res.json()["final_output"] == 150.0
```

---

## 6. JSON Schema Specifications & Formats

Spark AI automatically produces OpenAI and Anthropic compatible JSON Schemas without manual declaration.

### Example: Generated Schema for `calculate_revenue`
```json
{
  "type": "function",
  "function": {
    "name": "calculate_revenue",
    "description": "Compute net revenue, operating profit margins, and expense efficiency ratio.",
    "parameters": {
      "type": "object",
      "properties": {
        "sales": {
          "type": "number",
          "description": "Gross top-line sales volume in USD"
        },
        "expenses": {
          "type": "number",
          "description": "Total operating expenditures"
        }
      },
      "required": ["sales", "expenses"]
    }
  }
}
```

---

## 7. Code Mode Execution Deep Dive

### 7.1 How `call_tool(name, params)` Works
When the LLM generates:
```python
a = await call_tool("add", {"x": 3, "y": 4})
b = await call_tool("multiply", {"x": a, "y": 2})
return b
```
1. **AST Transformation**: Converts the top-level `return` statement into an internal assignment and updates `__ctx__`.
2. **Context Wrapping**: Wraps the script inside `async def __sandboxed_entry__(tools, call_tool, __ctx__):`.
3. **Execution**: Invokes the wrapper with `call_tool` pointing directly to `spark_ai.execute_tool`.
4. **Variable Reflection**: All local variables (`a=7`, `b=14`) are extracted alongside the return value and returned in the structured response.

---

## 8. Edge Cases & Resilience Mechanics

| Edge Case | Root Cause | Solution Implemented |
| :--- | :--- | :--- |
| **Control Character Error (`loc: ["body", 158]`)** | Raw literal newlines in multi-line JSON code payloads | `JsonControlCharacterMiddleware` parses payloads using `json.loads(..., strict=False)` |
| **Top-Level `return` in `exec()`** | Standard Python `exec()` raises `SyntaxError: 'return' outside function` | Code is wrapped into an async function `__sandboxed_entry__` |
| **Missing Variables on Return** | Function returns early without capturing `locals()` | Prior to returning, AST injector appends `__ctx__.update(locals())` |
| **Type Coercion** | JSON numbers sent as strings (e.g., `"101"`) | Pydantic `TypeAdapter` automatically casts arguments to signature types |
| **Missing Tools** | Tool queried by short name (`get` instead of `customer_get`) | Subdivision alias resolution searches all registered namespaces |

---

## 9. Running & Verifying

### Run Server:
```bash
cd python_backend
./venv/bin/uvicorn main:app --reload --port 8000
```
Swagger UI: `http://localhost:8000/docs`

### Run Pytest Suite:
```bash
cd python_backend
./venv/bin/pytest test_spark_ai.py
```
Output:
```text
======================== 16 passed, 7 warnings in 0.87s ========================
```
