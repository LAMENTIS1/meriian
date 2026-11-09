import ladybug as lb

db = lb.Database(":memory:")
conn = lb.Connection(db)

conn.execute("INSTALL json; LOAD json;")

result = conn.execute("""
    MATCH (w:Workflow {id: 'workflow_1'})
      -[r:HAS_STEP]->(s:Step)
RETURN w.id, s.name, r.sequence
ORDER BY r.sequence
""")

print(result.get_as_df())