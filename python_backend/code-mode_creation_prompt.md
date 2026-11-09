# Prompt: Building an Agentic "Code Mode" Framework in Python

> **Role & Purpose**: You are an expert Python systems architect specialized in agentic tool architectures, metaprogramming, and dynamic execution environments. Your goal is to design and implement an end-to-end **"Code Mode"** framework (inspired by Spark AI / Cloudflare Workers Code Mode / Anthropic Model-Context Protocol).
>
> In Code Mode, an AI agent or user does not rely on repetitive JSON-RPC back-and-forth tool calls. Instead, the model writes standard, idiomatic Python snippets with loops, conditionals, transformations, and native tool proxy access (e.g., `await tools.customer.get(customer_id=101)`).

---

## 1. Core Objectives & Requirements

Implement a modular, production-ready Python framework consisting of:

1. **`SparkAI` Central Registry (`spark_ai.py`)**:
   - Dynamic tool decorator `@spark_ai.tool` supporting namespacing / subdivisions (e.g. `customer`, `finance`, `data`, `math`).
   - Dynamic schema generation from Python signatures and type hints (OpenAPI / MCP function-calling format).
   - Unified execution engine supporting both synchronous (`def`) and asynchronous (`async def`) functions with runtime argument binding and validation.
   - Dynamic proxy generator (`get_tool_proxy()`) enabling both flat and subdivided object-oriented syntax (`tools.add(...)` and `tools.math.add(...)`).

2. **Code Mode Sandbox & Orchestrator API (`main.py` / FastAPI)**:
   - Dedicated `POST /tools/code-mode` endpoint.
   - Dynamic async function wrapping of submitted code blocks.
   - Scope injection of `tools` proxy, `call_tool`, and custom runtime variables.
   - Captures `sys.stdout` (logs), return expressions, and local namespace variables.
   - Robust error handling returning execution traces and timing metrics.

3. **Tool Definitions (`tools.py`)**:
   - Sample domain tools registered across multiple subdivisions demonstrating type hints, docstrings, and defaults.

---

## 2. Step-by-Step Architecture & Implementation Blueprint

### Step 1: Tool Registry & Decorator (`@spark_ai.tool`)
Implement the decorator with the following contract:
```python
@spark_ai.tool(
    name: Optional[str] = None,
    subdivision: str = "general",
    description: Optional[str] = None,
    tags: Optional[List[str]] = None
)
```
- **Reflection**: Use `inspect.signature(fn)` and `typing.get_type_hints(fn)` to extract parameter types and defaults.
- **Type Mapping**: Convert Python primitive types (`int`, `float`, `str`, `bool`, `list`, `dict`) and Pydantic types into JSON schema property objects.
- **Async Tracking**: Detect coroutines via `inspect.iscoroutinefunction(fn)`.
- **Storage**: Store metadata in:
  - `self.registry[tool_name]`
  - `self.subdivisions[subdivision][tool_name]`

---

### Step 2: The Metaprogramming Proxy Engine (`get_tool_proxy`)
Implement dynamic attribute access so code mode can execute tools naturally:

1. **`SubDivisionProxy`**:
   - Wraps tools in a given namespace (e.g., `tools.customer`).
   - Resolves exact names (e.g., `get_customer`) or aliases (e.g., `tools.customer.get(...)` mapping to `get_customer`).
   - Returns an async closure that executes the tool and raises on errors.
2. **`ToolProxy`**:
   - `__getattr__(self, item)` checks:
     - Is `item` a subdivision? If so, return `SubDivisionProxy(item, self.subdivisions[item])`.
     - Is `item` a registered flat tool? If so, return direct async caller closure.
     - Else, raise descriptive `AttributeError` listing available tools and subdivisions.

---

### Step 3: Tool Execution Engine (`execute_tool`)
Implement `async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]`:
- Verify tool existence in `self.registry`.
- Bind and validate arguments against the stored signature:
  ```python
  bound = signature.bind(**arguments)
  bound.apply_defaults()
  ```
- Invoke conditionally:
  - `await fn(*bound.args, **bound.kwargs)` for async functions.
  - `fn(*bound.args, **bound.kwargs)` for synchronous functions.
- Return standard response envelope:
  ```json
  { "success": true, "tool": "tool_name", "result": ... }
  ```
- Catch and return explicit errors for `TypeError` (bad arguments) and general `Exception`.

---

### Step 4: The Code Mode Async Sandbox Runner (`POST /tools/code-mode`)
In your FastAPI server or runner script:
1. Parse the incoming request containing `code: str` and optional `variables: Dict[str, Any]`.
2. Construct `tool_proxy = spark_ai.get_tool_proxy()`.
3. Build `local_scope` containing:
   - `tools`: The proxy instance.
   - `call_tool`: Async helper `call_tool(name, params)`.
   - `result`: Initialized to `None`.
   - `**variables`: User-supplied context.
4. Indent and wrap the user code into an async wrapper function:
   ```python
   async def __code_mode_runner__():
       # User's Python code here
   ```
5. Redirect `sys.stdout` to `io.StringIO()` to capture all `print()` outputs.
6. Compile with `exec(wrapper_code, global_scope, local_scope)`.
7. Execute: `result = await local_scope["__code_mode_runner__"]()`.
8. Collect:
   - `result`: Returned value or `local_scope.get("result")`.
   - `logs`: `captured_stdout.getvalue()`.
   - `variables`: Any local variables created in the runner.
   - `execution_time_ms`: Execution duration.

---

## 3. Example Code Mode Execution Payload

```json
{
  "code": "cust = await tools.customer.get(customer_id=101)\nprint(f'Customer ARR: {cust[\"arr\"]}')\nrev = await tools.finance.calculate_revenue(sales=cust['sales'], expenses=cust['expenses'])\nreturn {\"customer\": cust[\"name\"], \"net_revenue\": rev}",
  "variables": {}
}
```

**Expected Response**:
```json
{
  "success": true,
  "result": {
    "customer": "ABC Healthcare System",
    "net_revenue": 175000
  },
  "logs": "Customer ARR: 240000.0\n",
  "variables": {
    "cust": { ... },
    "rev": 175000
  },
  "execution_time_ms": 12.4
}
```

---

## 4. Deliverables Checklist
- [ ] `spark_ai.py` with `SparkAI`, `@spark_ai.tool`, dynamic schema extraction, `execute_tool`, and proxy (`get_tool_proxy`).
- [ ] `tools.py` with mock/real domain tools across subdivisions.
- [ ] `main.py` with FastAPI endpoints: `/tools/schema`, `/tools/execute`, and `/tools/code-mode`.
- [ ] Unit tests verifying synchronous execution, asynchronous execution, invalid parameter rejection, subdivision alias resolution, and code mode sandbox runs.
