# Test Cases, Edge Cases & Verification Guide

This guide details the complete test suite, verification results, and edge case coverage for the **Spark AI – Code Mode Tool Framework**.

---

## 1. Test Suite Overview

The test suite is located in [`python_backend/test_spark_ai.py`](file:///home/srivatsav/Videos/new_spark_sprky/python_backend/test_spark_ai.py). It uses `pytest` and FastAPI's `TestClient` to perform synchronous and asynchronous integration testing.

```
python_backend/
├── spark_ai.py          # Core engine & subdivision proxy
├── tools.py             # Tool definitions (math, customer, finance, data, optim)
├── main.py              # FastAPI app & Code Mode endpoints
├── test_spark_ai.py     # Automated test suite (12 test scenarios)
└── requirements.txt     # Dependencies
```

---

## 2. Test Scenarios Covered

### Category A: Schema & Discovery
| Test Function | Input / Target | Expected Behavior |
| :--- | :--- | :--- |
| `test_root_endpoint()` | `GET /` | Returns `200 OK`, `status: online`, registered tool count > 0. |
| `test_schema_generation()` | `GET /tools/schema` | Generates valid JSON schemas for registered functions with typed properties. |
| `test_subdivisions_listing()` | `GET /tools/subdivisions` | Verifies presence of `math`, `customer`, `finance`, `data`, and `optim` subdivisions. |
| `test_tool_search()` | `POST /tools/search` | Discovers relevant tools matching query tokens (e.g. `"customer revenue"`). |

---

### Category B: Code Mode Chaining (`call_tool`)
| Test Function | Script Under Test | Expected Behavior |
| :--- | :--- | :--- |
| `test_code_mode_call_tool_chaining()` | ```python<br>a = await call_tool('add', {'x': 3, 'y': 4})<br>b = await call_tool('multiply', {'x': a, 'y': 2})<br>return b<br>``` | Evaluates `a = 7.0`, passes `a` into multiply, returns `14.0`, records variables `{"a": 7.0, "b": 14.0}`. |
| `test_code_mode_customer_to_revenue_pipeline()` | ```python<br>cust = await call_tool('get_customer', {'customer_id': 101})<br>rev = await call_tool('calculate_revenue', {'sales': cust['sales'], 'expenses': cust['expenses']})<br>return {'client': cust['name'], 'net': rev['net_revenue']}<br>``` | Pipes customer 101 sales ($240,000) and expenses ($65,000) into revenue calculator, returns net profit `$175,000.0`. |
| `test_code_mode_subdivisions()` | ```python<br>cust = await tools.customer.get(customer_id=101)<br>rev = await tools.finance.calculate_revenue(...)<br>return {'company': cust['name'], 'margin': rev['operating_margin_pct']}<br>``` | Resolves namespaced tools via proxy (`tools.customer`, `tools.finance`), returns margin `72.92%`. |

---

### Category C: Multi-Step YAML Workflows
| Test Function | YAML Pipeline | Expected Behavior |
| :--- | :--- | :--- |
| `test_yaml_workflow_piping()` | ```yaml<br>steps:<br>  - id: step_add<br>    tool: add<br>    arguments: { x: 15, y: 5 }<br>  - id: step_mult<br>    tool: multiply<br>    arguments: { x: '{{step_add}}', y: 3 }<br>``` | Resolves `{{step_add}}` output (20.0), multiplies by 3, final output is `60.0`. |

---

### Category D: Edge Cases & Error Resilience
| Edge Case | Test Function | Handled Behavior |
| :--- | :--- | :--- |
| **Non-existent tool name** | `test_edge_case_non_existent_tool_direct()` | Returns `404 Not Found` with clean error detail: `"Tool 'ghost_tool_999' is not found"`. |
| **Invalid tool parameters** | `test_edge_case_invalid_arguments_direct()` | Returns `400 Bad Request` with detail: `"Invalid arguments: ... missing required argument"`. |
| **Python Syntax Error in script** | `test_edge_case_code_mode_syntax_error()` | Trapped in try/except; returns `{"success": false, "error": "invalid syntax"}` without crashing FastAPI. |
| **Unknown tool called inside Code Mode** | `test_edge_case_code_mode_calling_unknown_tool()` | `call_tool()` raises descriptive exception: `"Tool 'unknown_service' is not found"`. |
| **Execution Timeout (Infinite Loop)** | `test_edge_case_code_mode_timeout()` | Handled via `asyncio.wait_for()`; returns `{"success": false, "error": "Execution timed out after 0.5 seconds."}`. |
| **Failed step in YAML pipeline** | `test_edge_case_yaml_step_failure()` | Gracefully halts pipeline execution at the failed step and reports `failed_step_id`. |
| **Raw Unescaped Newlines in JSON** | Sanitizer Middleware in `main.py` | Automatically sanitized via middleware (`strict=False`) so multiline code strings never fail with `JSON decode error`. |

---

## 3. Running the Test Suite

```bash
cd python_backend
pip install pytest httpx
pytest test_spark_ai.py -v
```
