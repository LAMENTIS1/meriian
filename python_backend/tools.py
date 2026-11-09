"""
Developer-defined business and analytical tools decorated with @spark_ai.tool.
Any function or class decorated here is automatically registered, typed, and schema-generated.
"""
from typing import Dict, List, Optional
from spark_ai import spark_ai


# -----------------------------------------------------------------
# 0. MATH & BASIC ARITHMETIC TOOLS (Subdivision: "math")
# -----------------------------------------------------------------
@spark_ai.tool(subdivision="math")
def add(x: float, y: float) -> float:
    """Add two numbers together."""
    return x + y


@spark_ai.tool(subdivision="math")
def multiply(x: float, y: float) -> float:
    """Multiply two numbers together."""
    return x * y


@spark_ai.tool(subdivision="math")
def subtract(x: float, y: float) -> float:
    """Subtract y from x."""
    return x - y


# -----------------------------------------------------------------
# 1. CUSTOMER & ENTITY TOOLS (Subdivision: "customer")
# -----------------------------------------------------------------
@spark_ai.tool(subdivision="customer")
def get_customer(customer_id: int) -> Dict[str, any]:
    """
    Retrieve comprehensive customer profile, status, and health metrics by customer ID.
    Can be accessed via: tools.customer.get_customer(id) or tools.customer.get(id) or tools.get_customer(id)
    """
    mock_db = {
        101: {
            "customer_id": 101,
            "name": "ABC Healthcare System",
            "tier": "Enterprise Decile 1",
            "status": "Active",
            "arr": 240000.0,
            "churn_risk": "Low (4.2%)",
            "sales": 240000,
            "expenses": 65000
        },
        102: {
            "customer_id": 102,
            "name": "XYZ Global Pharma",
            "tier": "Enterprise Decile 2",
            "status": "At Risk",
            "arr": 185000.0,
            "churn_risk": "High (38.5%)",
            "sales": 185000,
            "expenses": 92000
        }
    }
    customer = mock_db.get(customer_id)
    if not customer:
        return {"error": f"Customer ID {customer_id} not found."}
    return customer


@spark_ai.tool(subdivision="customer")
def search_customers(query: str, limit: int = 5) -> List[Dict[str, any]]:
    """
    Search customer accounts by company name, industry, or keyword.
    Can be accessed via: tools.customer.search_customers(query) or tools.customer.search(query)
    """
    customers = [
        {"customer_id": 101, "name": "ABC Healthcare System", "status": "Active"},
        {"customer_id": 102, "name": "XYZ Global Pharma", "status": "At Risk"},
        {"customer_id": 103, "name": "OmniLife Diagnostics", "status": "Active"},
        {"customer_id": 104, "name": "Acuity Cloud Logistics", "status": "Churned"}
    ]
    matches = [c for c in customers if query.lower() in c["name"].lower()]
    return matches[:limit]


# -----------------------------------------------------------------
# 2. FINANCIAL & REVENUE TOOLS (Subdivision: "finance")
# -----------------------------------------------------------------
@spark_ai.tool(subdivision="finance")
def calculate_revenue(sales: float, expenses: float) -> Dict[str, float]:
    """
    Compute net revenue, operating profit margins, and expense efficiency ratio.
    Can be accessed via: tools.finance.calculate_revenue(...) or tools.finance.revenue(...)
    """
    net_revenue = sales - expenses
    margin = (net_revenue / sales * 100) if sales > 0 else 0.0
    return {
        "sales": sales,
        "expenses": expenses,
        "net_revenue": round(net_revenue, 2),
        "operating_margin_pct": round(margin, 2)
    }


# -----------------------------------------------------------------
# 3. DATA & SQL CONNECTOR TOOLS (Subdivision: "data")
# -----------------------------------------------------------------
@spark_ai.tool(subdivision="data")
async def query_dataset(table_name: str, limit: int = 100) -> Dict[str, any]:
    """
    Execute a high-speed telemetry query against connected datasets (orders, sales, kafka).
    Can be accessed via: tools.data.query_dataset(...) or tools.data.query(...)
    """
    return {
        "table": table_name,
        "scanned_records": 124000,
        "returned_rows": limit,
        "execution_time_ms": 14.2,
        "sample": [
            {"order_id": "ORD-9841", "amount": 1420.50, "status": "Delivered"},
            {"order_id": "ORD-9842", "amount": 2890.00, "status": "In Transit"}
        ]
    }


# -----------------------------------------------------------------
# 4. OPTIMIZATION & VECTOR TOOLS (Subdivision: "optim")
# -----------------------------------------------------------------
@spark_ai.tool(subdivision="optim")
def optimize_sql_query(sql_statement: str) -> Dict[str, any]:
    """
    Analyze slow SQL statements and generate partition pruning and key clustering recommendations.
    Can be accessed via: tools.optim.optimize_sql_query(...) or tools.optim.optimize(...)
    """
    return {
        "original_query": sql_statement,
        "estimated_cost_reduction_pct": 42.5,
        "recommendation": "Cluster table by transaction_date and prune unindexed customer_id joins.",
        "optimized_sql": f"/*+ CLUSTER_BY(date) */ {sql_statement} WHERE date >= CURRENT_DATE - 30"
    }
