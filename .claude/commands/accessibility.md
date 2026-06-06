---
description: Audit recent changes for security and accessibility issues by European Union law (look here for directions https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882)
allowed-tools: Read, Grep, Glob, Bash(git diff *)
model: claude-opus-4-7
---

Review the current git diff for security and accessibility vulnerabilities.
Check for: hardcoded secrets, SQL injection risks, exposed API keys, inaccurate, too small or invisible texts
missing input validation, and insecure dependency patterns.
Report findings grouped by severity: High, Medium, Low.
