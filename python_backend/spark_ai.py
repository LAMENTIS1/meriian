import inspect
import json
import re
import uuid
import asyncio
from typing import Any, Callable, Dict, List, Optional, Union, get_type_hints
from pydantic import TypeAdapter, ValidationError


class SparkAI:
    def __init__(self):
        self.registry: Dict[str, Dict[str, Any]] = {}
        self.subdivisions: Dict[str, Dict[str, Any]] = {}

    # -------------------------------------------------------------
    # 1. TOOL & SUBDIVISION DECORATOR
    # -------------------------------------------------------------
    def tool(
        self,
        func: Optional[Callable] = None,
        *,
        name: Optional[str] = None,
        subdivision: str = "general",
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ):
        """
        Decorator to register a function or method as an AI-callable tool.
        Supports organizing tools into subdivisions/modules (e.g., subdivision='customer' or subdivision='finance').
        """
        def register(fn: Callable):
            tool_name = name or fn.__name__
            hints = get_type_hints(fn) if hasattr(fn, "__annotations__") else {}
            signature = inspect.signature(fn)
            doc = description or inspect.getdoc(fn) or f"Execute tool {tool_name}"
            
            schema = self._build_schema(fn, signature, hints, doc)

            tool_data = {
                "name": tool_name,
                "subdivision": subdivision,
                "tags": tags or [],
                "description": doc.strip(),
                "function": fn,
                "signature": signature,
                "hints": hints,
                "schema": schema,
                "is_async": inspect.iscoroutinefunction(fn)
            }

            self.registry[tool_name] = tool_data
            
            # Group into subdivisions
            if subdivision not in self.subdivisions:
                self.subdivisions[subdivision] = {}
            self.subdivisions[subdivision][tool_name] = tool_data

            return fn

        if func is None:
            return register
        return register(func)

    # -------------------------------------------------------------
    # 2. SCHEMA GENERATOR
    # -------------------------------------------------------------
    def _build_schema(self, fn: Callable, signature: inspect.Signature, hints: Dict[str, Any], doc: str) -> Dict[str, Any]:
        """
        Derives an OpenAI/MCP-compatible JSON schema from python type hints and defaults.
        """
        properties: Dict[str, Any] = {}
        required: List[str] = []

        for param_name, param in signature.parameters.items():
            if param_name in ("self", "cls"):
                continue

            param_type = hints.get(param_name, Any)
            param_schema = self._type_to_json_schema(param_type)

            # Check if default is provided
            if param.default is inspect.Parameter.empty:
                required.append(param_name)
            else:
                param_schema["default"] = param.default

            properties[param_name] = param_schema

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

    def _type_to_json_schema(self, py_type: Any) -> Dict[str, Any]:
        """Maps basic Python types to JSON Schema definitions."""
        if py_type in (int,):
            return {"type": "integer"}
        elif py_type in (float,):
            return {"type": "number"}
        elif py_type in (str,):
            return {"type": "string"}
        elif py_type in (bool,):
            return {"type": "boolean"}
        elif py_type in (list, List):
            return {"type": "array", "items": {"type": "string"}}
        elif py_type in (dict, Dict):
            return {"type": "object"}
        else:
            try:
                adapter = TypeAdapter(py_type)
                return adapter.json_schema()
            except Exception:
                return {"type": "string"}

    # -------------------------------------------------------------
    # 3. SCHEMA RETRIEVAL
    # -------------------------------------------------------------
    def get_schemas(self, tool_name: Optional[str] = None) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        if tool_name:
            if tool_name not in self.registry:
                raise KeyError(f"Tool '{tool_name}' not registered in Spark AI.")
            return self.registry[tool_name]["schema"]
        return [meta["schema"] for meta in self.registry.values()]

    # -------------------------------------------------------------
    # 4. TOOL SEARCH / DISCOVERY (Semantic & Keyword)
    # -------------------------------------------------------------
    def search_tools(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Scans registered tools matching keywords in tool name or docstring.
        """
        tokens = re.findall(r"\w+", query.lower())
        scored_tools = []

        for name, meta in self.registry.items():
            text = f"{name} {meta['description']}".lower()
            score = sum(1 for token in tokens if token in text)
            if score > 0 or not query.strip():
                scored_tools.append((score, meta))

        # Sort by relevance score desc
        scored_tools.sort(key=lambda x: x[0], reverse=True)
        results = [item[1]["schema"] for item in scored_tools[:limit]]
        return results

    # -------------------------------------------------------------
    # 5. EXECUTION ENGINE
    # -------------------------------------------------------------
    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates arguments against the registered function and invokes it.
        Supports both sync and async functions.
        """
        if name not in self.registry:
            raise ValueError(f"Tool '{name}' is not found in Spark AI registry.")

        meta = self.registry[name]
        fn = meta["function"]
        is_async = meta["is_async"]

        try:
            # Bind arguments to verify against signature
            bound = meta["signature"].bind(**arguments)
            bound.apply_defaults()
            
            if is_async:
                result = await fn(*bound.args, **bound.kwargs)
            else:
                result = fn(*bound.args, **bound.kwargs)

            return {
                "success": True,
                "tool": name,
                "result": result
            }
        except TypeError as te:
            return {
                "success": False,
                "tool": name,
                "error": f"Invalid arguments: {str(te)}"
            }
        except Exception as ex:
            return {
                "success": False,
                "tool": name,
                "error": f"Execution error: {str(ex)}"
            }

    # -------------------------------------------------------------
    # 6. CODE-MODE ORCHESTRATION PROXY (WITH SUBDIVISION SUPPORT)
    # -------------------------------------------------------------
    def get_tool_proxy(self):
        """
        Returns a callable proxy object that supports both flat and subdivided calls:
            # 1. Flat access:
            res = await tools.get_customer(customer_id=101)

            # 2. Sub-divided / namespaced access:
            cust = await tools.customer.get(customer_id=101)
            rev  = await tools.finance.calculate_revenue(sales=1000, expenses=200)
            data = await tools.data.query(table_name="orders")
        """
        spark_instance = self

        class SubDivisionProxy:
            def __init__(self, subdiv_name: str, subdiv_dict: Dict[str, Any]):
                self._subdiv_name = subdiv_name
                self._subdiv_dict = subdiv_dict

            def __getattr__(self, item: str):
                # Match either exact name or short alias
                matched_tool = None
                if item in self._subdiv_dict:
                    matched_tool = item
                else:
                    # e.g., tools.customer.get -> get_customer
                    for t_name in self._subdiv_dict:
                        if t_name == item or t_name.startswith(f"{item}_") or t_name.endswith(f"_{item}"):
                            matched_tool = t_name
                            break

                if matched_tool:
                    async def caller(**kwargs):
                        res = await spark_instance.execute_tool(matched_tool, kwargs)
                        if not res["success"]:
                            raise RuntimeError(res.get("error"))
                        return res["result"]
                    return caller

                raise AttributeError(f"Subdivision '{self._subdiv_name}' has no tool '{item}'. Available: {list(self._subdiv_dict.keys())}")

        class ToolProxy:
            def __getattr__(proxy_self, item: str):
                # 1. First check if item is a subdivision (e.g. tools.customer or tools.finance)
                if item in spark_instance.subdivisions:
                    return SubDivisionProxy(item, spark_instance.subdivisions[item])

                # 2. Check if item is a direct flat tool (e.g. tools.get_customer)
                if item in spark_instance.registry:
                    async def caller(**kwargs):
                        res = await spark_instance.execute_tool(item, kwargs)
                        if not res["success"]:
                            raise RuntimeError(res.get("error"))
                        return res["result"]
                    return caller

                raise AttributeError(f"No tool or subdivision named '{item}'. Available tools: {list(spark_instance.registry.keys())}, Subdivisions: {list(spark_instance.subdivisions.keys())}")

        return ToolProxy()


# Global Singleton instance
spark_ai = SparkAI()
