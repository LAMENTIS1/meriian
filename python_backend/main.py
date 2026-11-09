import io
import sys
import json
import asyncio
import traceback
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import yaml
except ImportError:
    yaml = None

from spark_ai import spark_ai
# Importing tools automatically registers functions into spark_ai.registry
import tools
# Importing ingen_loader automatically loads and registers all ingen_customer and ingen_optim tools
import ingen_loader


app = FastAPI(
    title="Spark AI – Code Mode Tool Framework",
    description="Dynamic Python tool discovery, automated schema generation, and code-mode execution framework for AI agents.",
    version="1.0.0"
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def sanitize_raw_newlines_middleware(request: Request, call_next):
    """
    Middleware that tolerates unescaped newlines/tabs inside JSON string payloads
    (common when pasting multiline Python scripts into Swagger or curl without \n escaping).
    """
    if request.method in ("POST", "PUT", "PATCH"):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            raw_body = await request.body()
            try:
                # Try standard parsing first
                json.loads(raw_body)
            except Exception:
                # If it failed due to control characters (like raw unescaped newlines), parse with strict=False
                try:
                    text = raw_body.decode("utf-8")
                    parsed = json.loads(text, strict=False)
                    # Re-encode as strict valid JSON
                    sanitized_bytes = json.dumps(parsed).encode("utf-8")
                    
                    # Create a replacement receive coroutine
                    async def custom_receive():
                        return {"type": "http.request", "body": sanitized_bytes, "more_body": False}
                    request._receive = custom_receive
                except Exception:
                    pass

    response = await call_next(request)
    return response


# -----------------------------------------------------------------
# REQUEST & RESPONSE MODELS
# -----------------------------------------------------------------
class ToolSearchRequest(BaseModel):
    query: str = Field(..., description="Semantic or keyword query to discover relevant tools", example="customer revenue analysis")
    limit: int = Field(default=5, description="Maximum number of tools to return")


class ToolExecuteRequest(BaseModel):
    name: str = Field(..., description="Registered tool function name", example="calculate_revenue")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Key-value arguments matching tool parameters", example={"sales": 100000, "expenses": 30000})


class BatchExecuteRequest(BaseModel):
    calls: List[ToolExecuteRequest]


class CodeModeExecuteRequest(BaseModel):
    code: str = Field(..., description="Python script composition invoking tools through 'tools' proxy", example="c = await tools.get_customer(customer_id=101)\nrev = await tools.calculate_revenue(sales=c['sales'], expenses=c['expenses'])\nresult = rev")
    variables: Dict[str, Any] = Field(default_factory=dict, description="Optional input variables injected into the execution context")
    timeout_seconds: Optional[float] = Field(default=30.0, description="Execution timeout in seconds")


class YamlPipelineStep(BaseModel):
    id: Optional[str] = Field(None, description="Step identifier to store output into variables", example="cust_info")
    tool: str = Field(..., description="Registered tool name", example="get_customer")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments. Supports {{variable}} references from previous steps.")


class YamlWorkflowRequest(BaseModel):
    yaml_content: Optional[str] = Field(None, description="Raw YAML string defining a pipeline or sequence of tool calls")
    steps: Optional[List[YamlPipelineStep]] = Field(None, description="Alternative structured list of steps")
    initial_variables: Dict[str, Any] = Field(default_factory=dict, description="Variables seeded into the workflow")


# -----------------------------------------------------------------
# 1. ROOT & HEALTH
# -----------------------------------------------------------------
@app.get("/", tags=["System"])
def root():
    return {
        "status": "online",
        "framework": "Spark AI Code Mode",
        "registered_tools_count": len(spark_ai.registry),
        "docs_url": "/docs"
    }


@app.get("/tools/subdivisions", tags=["Tool Discovery"])
def get_subdivisions():
    """
    Returns all registered tool subdivisions and their member tools.
    """
    summary = {}
    for subdiv_name, tools_dict in spark_ai.subdivisions.items():
        summary[subdiv_name] = [
            {"name": t_name, "description": meta["description"]}
            for t_name, meta in tools_dict.items()
        ]
    return {
        "success": True,
        "count": len(summary),
        "subdivisions": summary
    }


# -----------------------------------------------------------------
# 2. GET SCHEMA (OpenAI & MCP Compatible)
# -----------------------------------------------------------------
@app.get("/tools/schema", tags=["Tool Discovery"])
def get_schemas(name: Optional[str] = None):
    """
    Returns OpenAI/MCP-compatible JSON schema for all registered tools,
    or a specific tool if 'name' query parameter is specified.
    """
    try:
        return {
            "success": True,
            "schemas": spark_ai.get_schemas(tool_name=name)
        }
    except KeyError as ke:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ke))


# -----------------------------------------------------------------
# 3. SEARCH TOOLS
# -----------------------------------------------------------------
@app.post("/tools/search", tags=["Tool Discovery"])
def search_tools(req: ToolSearchRequest):
    """
    Discovers matching tools based on user task or query keywords.
    """
    matches = spark_ai.search_tools(query=req.query, limit=req.limit)
    return {
        "success": True,
        "query": req.query,
        "count": len(matches),
        "tools": matches
    }


# -----------------------------------------------------------------
# 4. EXECUTE TOOL
# -----------------------------------------------------------------
@app.post("/tools/execute", tags=["Tool Execution"])
async def execute_tool(req: ToolExecuteRequest):
    """
    Executes a single tool with supplied arguments.
    """
    try:
        res = await spark_ai.execute_tool(name=req.name, arguments=req.arguments)
        if not res.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


# -----------------------------------------------------------------
# 5. BATCH EXECUTE
# -----------------------------------------------------------------
@app.post("/tools/batch-execute", tags=["Tool Execution"])
async def batch_execute(req: BatchExecuteRequest):
    """
    Executes multiple tools in parallel or sequence.
    """
    results = []
    for call in req.calls:
        res = await spark_ai.execute_tool(name=call.name, arguments=call.arguments)
        results.append(res)
    return {
        "success": True,
        "total": len(results),
        "results": results
    }


# -----------------------------------------------------------------
# 6. CODE MODE COMPOSITION (Python Async Sandbox Evaluation)
# -----------------------------------------------------------------
@app.post("/tools/code-mode", tags=["Code Mode"])
async def code_mode_exec(req: CodeModeExecuteRequest):
    """
    Direct Code Mode runner: Allows LLM to generate Python code composing
    multiple tools through the secure 'tools' proxy.
    Captures stdout/print logs, supports return expressions or 'result' variable,
    and returns executed variables and timing.
    """
    tool_proxy = spark_ai.get_tool_proxy()
    
    # Provide call_tool function for direct tool invocation syntax:
    # a = await call_tool("add", {"x": 3, "y": 4})
    async def call_tool(name: str, params: Optional[Dict[str, Any]] = None):
        res = await spark_ai.execute_tool(name, params or {})
        if not res.get("success"):
            raise RuntimeError(res.get("error", f"Tool {name} failed"))
        return res["result"]

    # Initialize scope with call_tool, tool_proxy, variables, and math helpers
    local_scope: Dict[str, Any] = {
        "call_tool": call_tool,
        "tools": tool_proxy,
        "result": None,
        **(req.variables or {})
    }

    # Intercept print / stdout logs
    captured_stdout = io.StringIO()
    old_stdout = sys.stdout

    # Indent the user's Python code into an async runner
    lines = req.code.strip().splitlines()
    has_explicit_return = any(line.strip().startswith("return ") or line.strip() == "return" for line in lines)
    
    indented_code = "\n".join(f"    {line}" for line in lines)
    
    # Store locals into runner_scope so caller can inspect all assigned variables
    if has_explicit_return:
        # Wrap return so we can capture locals right before exit
        # We replace "return <expr>" with "__res__ = <expr>; __ctx__.update(locals()); return __res__"
        wrapped_lines = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("return "):
                indent = line[:len(line) - len(line.lstrip())]
                ret_val = stripped[len("return "):]
                wrapped_lines.append(f"{indent}__final_res__ = {ret_val}")
                wrapped_lines.append(f"{indent}__ctx__.update({{k: v for k, v in locals().items() if not k.startswith('_')}})")
                wrapped_lines.append(f"{indent}return __final_res__")
            else:
                wrapped_lines.append(line)
        wrapped_code = "\n".join(f"    {l}" for l in wrapped_lines)
        wrapped_script = (
            "async def __run_spark_code__(__ctx__):\n"
            f"{wrapped_code}\n"
            "    __ctx__.update({k: v for k, v in locals().items() if not k.startswith('_')})\n"
        )
    else:
        wrapped_script = (
            "async def __run_spark_code__(__ctx__):\n"
            f"{indented_code}\n"
            "    __ctx__.update({k: v for k, v in locals().items() if not k.startswith('_')})\n"
            "    return locals().get('result')\n"
        )

    try:
        sys.stdout = captured_stdout
        exec(wrapped_script, {"call_tool": call_tool, "tools": tool_proxy, "json": json}, local_scope)
        runner_fn = local_scope["__run_spark_code__"]
        
        # Execute with optional timeout
        exec_ctx = {}
        if req.timeout_seconds:
            output = await asyncio.wait_for(runner_fn(exec_ctx), timeout=req.timeout_seconds)
        else:
            output = await runner_fn(exec_ctx)

        stdout_text = captured_stdout.getvalue()
        
        # Helper to serialize Polars/Pandas dataframes and custom objects to JSON-safe primitives
        def _make_json_safe(v):
            if hasattr(v, "to_dicts"):
                return v.to_dicts()
            if hasattr(v, "to_dict"):
                return v.to_dict(orient="records")
            if isinstance(v, dict):
                return {k: _make_json_safe(val) for k, val in v.items()}
            if isinstance(v, list):
                return [_make_json_safe(item) for item in v]
            if isinstance(v, (int, float, bool, str)) or v is None:
                return v
            return str(v)

        # Combine local_scope and exec_ctx
        combined_vars = {**local_scope, **exec_ctx}
        clean_vars = {
            k: _make_json_safe(v) for k, v in combined_vars.items()
            if k not in ("tools", "call_tool", "result", "__run_spark_code__") and not k.startswith("_")
        }

        return {
            "success": True,
            "mode": "code_mode_execution",
            "result": _make_json_safe(output),
            "stdout": stdout_text.strip(),
            "variables": clean_vars
        }
    except asyncio.TimeoutError:
        return {
            "success": False,
            "mode": "code_mode_execution",
            "error": f"Execution timed out after {req.timeout_seconds} seconds."
        }
    except Exception as e:
        return {
            "success": False,
            "mode": "code_mode_execution",
            "error": str(e),
            "traceback": traceback.format_exc()
        }
    finally:
        sys.stdout = old_stdout


# -----------------------------------------------------------------
# 7. YAML MULTI-STEP WORKFLOW / PIPELINE EXECUTION
# -----------------------------------------------------------------
def _resolve_template_vars(val: Any, variables: Dict[str, Any]) -> Any:
    """Helper to resolve {{var.field}} references in YAML pipeline parameters."""
    if isinstance(val, str):
        # Match pattern {{path.to.key}}
        import re
        match = re.fullmatch(r"\{\{([a-zA-Z0-9_\.]+)\}\}", val.strip())
        if match:
            path = match.group(1).split(".")
            curr = variables
            for p in path:
                if isinstance(curr, dict) and p in curr:
                    curr = curr[p]
                else:
                    return val
            return curr
        else:
            # Inline string replacement
            for k, v in variables.items():
                if isinstance(v, (str, int, float)):
                    val = val.replace(f"{{{{{k}}}}}", str(v))
            return val
    elif isinstance(val, dict):
        return {k: _resolve_template_vars(v, variables) for k, v in val.items()}
    elif isinstance(val, list):
        return [_resolve_template_vars(item, variables) for item in val]
    return val


@app.post("/tools/yaml-workflow", tags=["YAML Pipelines"])
async def execute_yaml_workflow(req: YamlWorkflowRequest):
    """
    Execute multi-tool batch workflows defined via YAML string or structured steps.
    Passes outputs of earlier steps into subsequent tools using {{step_id.field}} variables.
    """
    steps_data = []

    if req.yaml_content:
        if yaml is None:
            # Fallback simple json parser if yaml package not yet imported
            try:
                parsed = json.loads(req.yaml_content)
            except Exception:
                raise HTTPException(status_code=400, detail="PyYAML not installed and content is not JSON. Install pyyaml.")
        else:
            parsed = yaml.safe_load(req.yaml_content)

        if isinstance(parsed, dict) and "steps" in parsed:
            steps_data = parsed["steps"]
        elif isinstance(parsed, list):
            steps_data = parsed
        else:
            steps_data = [parsed]
    elif req.steps:
        steps_data = [s.model_dump() for s in req.steps]
    else:
        raise HTTPException(status_code=400, detail="Either 'yaml_content' or 'steps' must be provided.")

    execution_context = dict(req.initial_variables)
    step_results = []

    for i, step in enumerate(steps_data):
        tool_name = step.get("tool")
        step_id = step.get("id", f"step_{i+1}")
        raw_args = step.get("arguments", {})

        # Resolve references from previous steps
        resolved_args = _resolve_template_vars(raw_args, execution_context)

        # Execute tool
        try:
            step_res = await spark_ai.execute_tool(tool_name, resolved_args)
        except Exception as e:
            step_res = {"success": False, "error": str(e)}
        
        if not step_res.get("success"):
            return {
                "success": False,
                "failed_step_id": step_id,
                "tool": tool_name,
                "error": step_res.get("error"),
                "completed_steps": step_results
            }

        result_data = step_res["result"]
        execution_context[step_id] = result_data
        step_results.append({
            "step_id": step_id,
            "tool": tool_name,
            "arguments": resolved_args,
            "result": result_data
        })

    return {
        "success": True,
        "mode": "yaml_workflow",
        "total_steps": len(step_results),
        "steps": step_results,
        "final_output": step_results[-1]["result"] if step_results else None,
        "context_variables": execution_context
    }
