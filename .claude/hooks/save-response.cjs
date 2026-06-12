// Stop hook: rolling log — promts.md holds at most ONE prompt and ONE reply.
// When the turn ends, Claude's last on-screen reply replaces the previous reply
// (the current prompt is kept). Reads hook JSON on stdin, opens transcript_path
// (JSONL), walks backward to the last assistant message with visible text.
// Dedups by message uuid so Stop firing on clear/resume/compact does not
// re-write the same reply. (.cjs because package.json sets "type":"module".)
const fs = require("fs");
const path = require("path");
const TARGET = path.join(__dirname, "..", "..", "promts.md");
const SEEN = path.join(__dirname, ".last-response-uuid");

const HEADER = `# Prompt + reply log (git-ignored)

> Auto-maintained by hooks (\`.claude/hooks/\`). Holds ONLY the latest exchange:
> max 1 prompt + 1 reply. A new prompt replaces the previous one the **instant**
> you press enter (survives a mid-turn computer restart); Claude's reply replaces
> the previous reply when the turn ends.

---
`;

function lastSection(content, marker) {
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
  let tp = "";
  try {
    tp = JSON.parse(raw).transcript_path || "";
  } catch {}
  if (!tp || !fs.existsSync(tp)) process.exit(0);

  let text = "";
  let uuid = "";
  try {
    const lines = fs.readFileSync(tp, "utf8").split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let o;
      try {
        o = JSON.parse(lines[i]);
      } catch {
        continue;
      }
      if (o.type !== "assistant" || !o.message) continue;
      const t = (o.message.content || [])
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim();
      if (t) {
        text = t;
        uuid = o.uuid || "";
        break;
      }
    }
  } catch {}
  if (!text) process.exit(0);

  try {
    if (uuid && fs.existsSync(SEEN) && fs.readFileSync(SEEN, "utf8") === uuid) {
      process.exit(0);
    }
  } catch {}

  let prevPrompt = "";
  try {
    prevPrompt = lastSection(fs.readFileSync(TARGET, "utf8"), "## > ");
  } catch {}

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  let out = HEADER;
  if (prevPrompt) out += `\n${prevPrompt}\n`;
  out += `\n## < ${ts}  CLAUDE\n\n${text}\n`;
  try {
    fs.writeFileSync(TARGET, out);
    if (uuid) fs.writeFileSync(SEEN, uuid);
  } catch {}
  process.exit(0);
});
