import fs from "fs";
import path from "path";

const INPUT_FILE = "tasks.txt";
const OUTPUT_DIR = "kubernetes_tasks"; // klasör projenin içinde oluşturulacak

function sanitizeName(name) {
  return name.trim().replace(/[ /]/g, "_");
}

function writeMdFile(filePath, title) {
  fs.writeFileSync(filePath, `# ${title}\n\nDocumentation placeholder.\n`, "utf-8");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const lines = fs
  .readFileSync(INPUT_FILE, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

ensureDir(OUTPUT_DIR);

let levelStack = [OUTPUT_DIR];
let indexStack = [0];

for (const line of lines) {
  const name = sanitizeName(line);
  const isSubItem = line.split(" ").length > 3;

  if (isSubItem) {
    const parentDir = levelStack[levelStack.length - 1];
    indexStack[indexStack.length - 1]++;
    const idx = String(indexStack[indexStack.length - 1]).padStart(2, "0");
    const filePath = path.join(parentDir, `${idx}_${name}.md`);
    writeMdFile(filePath, line);
  } else {
    indexStack[indexStack.length - 1]++;
    const idx = String(indexStack[indexStack.length - 1]).padStart(2, "0");
    const newDir = path.join(levelStack[levelStack.length - 1], `${idx}_${name}`);
    ensureDir(newDir);
    levelStack.push(newDir);
    indexStack.push(0);
  }
}

console.log(`✅ Dizin yapısı '${OUTPUT_DIR}' klasöründe oluşturuldu.`);
