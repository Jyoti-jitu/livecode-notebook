import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

function executeLocally(code: string, language: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const tempDir = path.join(process.cwd(), 'artifacts', 'scratch');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filename = `run_${Date.now()}`;
    let filepath = '', command = '', classFilePath = '', binaryPath = '';
    const lang = language.toLowerCase();
    if (lang === 'python' || lang === 'py') {
      filepath = path.join(tempDir, `${filename}.py`);
      fs.writeFileSync(filepath, code);
      command = `python3 "${filepath}"`;
    } else if (lang === 'javascript' || lang === 'js') {
      filepath = path.join(tempDir, `${filename}.js`);
      fs.writeFileSync(filepath, code);
      command = `node "${filepath}"`;
    } else if (lang === 'java') {
      const match = code.match(/public\s+class\s+(\w+)/);
      const className = match ? match[1] : 'Main';
      filepath = path.join(tempDir, `${className}.java`);
      classFilePath = path.join(tempDir, `${className}.class`);
      fs.writeFileSync(filepath, code);
      command = `javac "${filepath}" && java -cp "${tempDir}" "${className}"`;
    } else if (lang === 'c') {
      filepath = path.join(tempDir, `${filename}.c`);
      binaryPath = path.join(tempDir, filename);
      fs.writeFileSync(filepath, code);
      command = `gcc "${filepath}" -o "${binaryPath}" && "${binaryPath}"`;
    } else if (lang === 'cpp' || lang === 'c++') {
      filepath = path.join(tempDir, `${filename}.cpp`);
      binaryPath = path.join(tempDir, filename);
      fs.writeFileSync(filepath, code);
      command = `g++ "${filepath}" -o "${binaryPath}" && "${binaryPath}"`;
    } else {
      resolve({ stdout: '', stderr: `Local fallback not supported for: ${language}` });
      return;
    }
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      try { if (filepath && fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (e) {}
      try { if (classFilePath && fs.existsSync(classFilePath)) fs.unlinkSync(classFilePath); } catch (e) {}
      try { if (binaryPath && fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath); } catch (e) {}
      resolve({ stdout: stdout || '', stderr: stderr || (error ? error.message : '') });
    });
  });
}

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code content is required' }, { status: 400 });
    let pistonLanguage = language.toLowerCase();
    if (pistonLanguage === 'py') pistonLanguage = 'python';
    if (pistonLanguage === 'js') pistonLanguage = 'javascript';
    if (pistonLanguage === 'cpp') pistonLanguage = 'c++';
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: pistonLanguage, version: '*', files: [{ content: code }] })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.run) return NextResponse.json({ stdout: result.run.stdout || '', stderr: result.run.stderr || '', exitCode: result.run.code });
      }
    } catch (e) { console.warn('Piston API failed, using local runner:', e); }
    const localResult = await executeLocally(code, pistonLanguage);
    return NextResponse.json({ stdout: localResult.stdout, stderr: localResult.stderr, exitCode: localResult.stderr ? 1 : 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal execution error' }, { status: 500 });
  }
}
