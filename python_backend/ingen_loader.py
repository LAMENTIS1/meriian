import os, sys, importlib.util, glob

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_ingen_tools():
    pattern = os.path.join(_CURRENT_DIR, 'ingen_*', '*', '*.py')
    for filepath in sorted(glob.glob(pattern)):
        if filepath.endswith('__init__.py'):
            continue
        mod_name = os.path.basename(filepath).replace('.py', '')
        try:
            spec = importlib.util.spec_from_file_location(mod_name, filepath)
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
        except Exception as e:
            print(f'Warning: Failed to load {filepath}: {e}')

# Auto-load on import
_load_ingen_tools()
