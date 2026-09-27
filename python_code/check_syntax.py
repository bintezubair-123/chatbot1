import ast
for f in ["api/auth.py", "api/database.py", "api/server.py"]:
    with open(f, encoding="utf-8") as fh:
        ast.parse(fh.read())
    print(f"OK: {f}")
print("All files clean.")
