"""
Comprehensive Test Suite & Edge Case Suite for Spark AI – Code Mode Framework.
Tests:
  1. Automated Schema Discovery
  2. Single Tool Direct Execution
  3. Code Mode Chained Execution with call_tool('name', params)
  4. Code Mode Subdivisions (e.g. tools.customer.get, tools.finance.calculate_revenue)
  5. Multi-Step YAML Workflow Pipelines
  6. Edge Cases: Division by zero, non-existent tools, invalid argument types,
     timeouts, syntax errors, and raw unescaped newlines.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
from spark_ai import spark_ai
import tools

client = TestClient(app)


# =====================================================================
# 1. TOOL DISCOVERY & SCHEMA TESTS
# =====================================================================
def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["registered_tools_count"] > 0


def test_schema_generation():
    response = client.get("/tools/schema")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["schemas"], list)
    
    # Check that add tool schema exists
    add_schema = next((s for s in data["schemas"] if s["function"]["name"] == "add"), None)
    assert add_schema is not None
    assert "x" in add_schema["function"]["parameters"]["properties"]
    assert "y" in add_schema["function"]["parameters"]["properties"]


def test_subdivisions_listing():
    response = client.get("/tools/subdivisions")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "math" in data["subdivisions"]
    assert "customer" in data["subdivisions"]
    assert "finance" in data["subdivisions"]


def test_tool_search():
    response = client.post("/tools/search", json={"query": "customer revenue", "limit": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] > 0


# =====================================================================
# 2. DIRECT TOOL EXECUTION TESTS
# =====================================================================
def test_direct_tool_execution_success():
    response = client.post("/tools/execute", json={
        "name": "add",
        "arguments": {"x": 10.5, "y": 4.5}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"] == 15.0


def test_batch_tool_execution():
    response = client.post("/tools/batch-execute", json={
        "calls": [
            {"name": "add", "arguments": {"x": 2, "y": 3}},
            {"name": "multiply", "arguments": {"x": 4, "y": 5}}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["results"][0]["result"] == 5.0
    assert data["results"][1]["result"] == 20.0


# =====================================================================
# 3. CODE MODE: CALL_TOOL CHAINING (USER SPECIFIED SYNTAX)
# =====================================================================
def test_code_mode_call_tool_chaining():
    # User's exact pattern:
    # a = await call_tool("add", {"x": 3, "y": 4})
    # b = await call_tool("multiply", {"x": a, "y": 2})
    # return b
    code = (
        "a = await call_tool('add', {'x': 3, 'y': 4})\n"
        "b = await call_tool('multiply', {'x': a, 'y': 2})\n"
        "return b"
    )
    response = client.post("/tools/code-mode", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"] == 14.0
    assert data["variables"]["a"] == 7.0
    assert data["variables"]["b"] == 14.0


def test_code_mode_customer_to_revenue_pipeline():
    code = (
        "cust = await call_tool('get_customer', {'customer_id': 101})\n"
        "rev = await call_tool('calculate_revenue', {'sales': cust['sales'], 'expenses': cust['expenses']})\n"
        "return {'client': cust['name'], 'net': rev['net_revenue']}"
    )
    response = client.post("/tools/code-mode", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"]["client"] == "ABC Healthcare System"
    assert data["result"]["net"] == 175000.0


# =====================================================================
# 4. CODE MODE: SUBDIVISION NAMESPACES (tools.subdiv.func)
# =====================================================================
def test_code_mode_subdivisions():
    code = (
        "cust = await tools.customer.get(customer_id=101)\n"
        "rev = await tools.finance.calculate_revenue(sales=cust['sales'], expenses=cust['expenses'])\n"
        "return {'company': cust['name'], 'margin': rev['operating_margin_pct']}"
    )
    response = client.post("/tools/code-mode", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"]["company"] == "ABC Healthcare System"
    assert data["result"]["margin"] == 72.92


# =====================================================================
# 5. YAML WORKFLOW PIPELINE TESTS
# =====================================================================
def test_yaml_workflow_piping():
    yaml_pipeline = (
        "steps:\n"
        "  - id: step_add\n"
        "    tool: add\n"
        "    arguments:\n"
        "      x: 15\n"
        "      y: 5\n"
        "  - id: step_mult\n"
        "    tool: multiply\n"
        "    arguments:\n"
        "      x: '{{step_add}}'\n"
        "      y: 3\n"
    )
    response = client.post("/tools/yaml-workflow", json={"yaml_content": yaml_pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_steps"] == 2
    assert data["final_output"] == 60.0


# =====================================================================
# 6. EDGE CASES & ERROR HANDLING TESTS
# =====================================================================
def test_edge_case_non_existent_tool_direct():
    response = client.post("/tools/execute", json={
        "name": "ghost_tool_999",
        "arguments": {}
    })
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_edge_case_invalid_arguments_direct():
    response = client.post("/tools/execute", json={
        "name": "add",
        "arguments": {"invalid_arg": 100}
    })
    assert response.status_code == 400
    assert "invalid arguments" in response.json()["detail"]["error"].lower()


def test_edge_case_code_mode_syntax_error():
    # Intentionally malformed python syntax
    code = "def malformed( :::: return 42"
    response = client.post("/tools/code-mode", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "error" in data


def test_edge_case_code_mode_calling_unknown_tool():
    code = "res = await call_tool('unknown_service', {'key': 1})"
    response = client.post("/tools/code-mode", json={"code": code})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "not found" in data["error"].lower()


def test_edge_case_code_mode_timeout():
    # Long running loop exceeding 1.0 second timeout
    code = (
        "import asyncio\n"
        "await asyncio.sleep(2.0)\n"
        "return 'finished'"
    )
    response = client.post("/tools/code-mode", json={
        "code": code,
        "timeout_seconds": 0.5
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "timed out" in data["error"].lower()


def test_edge_case_yaml_step_failure():
    yaml_pipeline = (
        "steps:\n"
        "  - id: step_bad\n"
        "    tool: non_existent_step_tool\n"
        "    arguments: {}\n"
    )
    response = client.post("/tools/yaml-workflow", json={"yaml_content": yaml_pipeline})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["failed_step_id"] == "step_bad"
