// UserPromptSubmit hook: rolling log — promts.md holds at most ONE prompt and
// ONE reply. A new prompt replaces the previous prompt the instant it is sent
// (survives a mid-turn computer restart); the previous reply is kept until the
// Stop hook replaces it. Reads hook JSON on stdin. TARGET resolved via
// __dirname so cwd never matters. (.cjs because package.json sets "type":"module".)
const fs = require("fs");
const path = require("path");
const TARGET = path.join(__dirname, "..", "..", "promts.md");

const HEADER = `# Prompt + reply log (git-ignored)

> Auto-maintained by hooks (\`.claude/hooks/\`). Holds ONLY the latest exchange:
> max 1 prompt + 1 reply. A new prompt replaces the previous one the **instant**
> you press enter (survives a mid-turn computer restart); Claude's reply replaces
> the previous reply when the turn ends.

---
`;

function lastSection(content, marker) {
  // marker: "## > " (prompt) or "## < " (claude)
  const lines = content.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(marker)) start = i;
  }
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## > ") || lines[i].startsWith("## < ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trimEnd();
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let prompt = "";
  try {
    prompt = (JSON.parse(raw).prompt || "").trim();
  } catch {}
  if (!prompt) process.exit(0);

  let prevReply = "";
  try {
    prevReply = lastSection(fs.readFileSync(TARGET, "utf8"), "## < ");
  } catch {}

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  let out = HEADER;
  if (prevReply) out += `\n${prevReply}\n`;
  out += `\n## > ${ts}  PROMPT\n\n${prompt}\n`;
  try {
    fs.writeFileSync(TARGET, out);
  } catch {}
  process.exit(0);
});
