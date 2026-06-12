'use client';

let pyodideInstance: any = null;
let pyodidePromise: Promise<any> | null = null;

export function loadPyodideScript(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('Pyodide can only be loaded in the browser.')); return; }
    if ((window as any).loadPyodide) { resolve((window as any).loadPyodide); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    script.async = true;
    script.onload = () => resolve((window as any).loadPyodide);
    script.onerror = () => reject(new Error('Failed to load Pyodide script from CDN.'));
    document.head.appendChild(script);
  });
  return pyodidePromise;
}

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  const loadPyodide = await loadPyodideScript();
  pyodideInstance = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/' });
  await pyodideInstance.loadPackage(['numpy', 'pandas', 'micropip']);
  await pyodideInstance.runPythonAsync(`
import sys, io, json
import numpy as np
import pandas as pd

def run_notebook_cell(code_str):
    import ast
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        import traceback
        return json.dumps({"type": "error", "message": traceback.format_exc()})
    if not tree.body:
        return json.dumps({"type": "text", "stdout": "", "result": None})
    last_node = tree.body[-1]
    is_expr = isinstance(last_node, ast.Expr)
    stdout_buf = io.StringIO()
    sys.stdout = stdout_buf
    g = globals()
    try:
        if is_expr:
            preceding_tree = ast.Module(body=tree.body[:-1], type_ignores=[])
            exec(compile(preceding_tree, '<notebook>', 'exec'), g)
            expr_val = eval(compile(ast.Expression(body=last_node.value), '<notebook>', 'eval'), g)
        else:
            exec(compile(tree, '<notebook>', 'exec'), g)
            expr_val = None
        sys.stdout = sys.__stdout__
        stdout_val = stdout_buf.getvalue()
        if isinstance(expr_val, pd.DataFrame):
            df_json = expr_val.to_json(orient='split')
            return json.dumps({"type": "table", "stdout": stdout_val, "data": json.loads(df_json)})
        elif isinstance(expr_val, pd.Series):
            df_json = expr_val.to_frame().to_json(orient='split')
            return json.dumps({"type": "table", "stdout": stdout_val, "data": json.loads(df_json)})
        elif expr_val is not None:
            return json.dumps({"type": "text", "stdout": stdout_val, "result": str(expr_val)})
        else:
            return json.dumps({"type": "text", "stdout": stdout_val, "result": None})
    except Exception as e:
        sys.stdout = sys.__stdout__
        import traceback
        return json.dumps({"type": "error", "message": traceback.format_exc()})
`);
  return pyodideInstance;
}

export async function runPythonCell(code: string, files?: { name: string; content: string }[]): Promise<any> {
  try {
    const pyodide = await getPyodide();
    if (files && files.length > 0) {
      for (const file of files) pyodide.FS.writeFile(file.name, file.content);
    }
    pyodide.globals.set('__current_cell_code__', code);
    const jsonStr = await pyodide.runPythonAsync(`run_notebook_cell(__current_cell_code__)`);
    return JSON.parse(jsonStr);
  } catch (err: any) {
    return { type: 'error', message: err.message || 'Fatal execution error inside Pyodide.' };
  }
}
