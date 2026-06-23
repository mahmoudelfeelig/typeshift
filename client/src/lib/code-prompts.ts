export type CodeLanguage = "typescript" | "python" | "rust" | "sql";
export type CodeIndentMode = "preserve" | "flat";

export interface CodePrompt {
  tokens: string[];
  lineStarts: Record<number, number>;
}

export const CODE_SNIPPETS: Record<CodeLanguage, string[][]> = {
  typescript: [
    [
      "type LeaderboardRow = {",
      "  handle: string;",
      "  wpm: number;",
      "  accuracy: number;",
      "  certified: boolean;",
      "};",
    ],
    [
      "export async function loadReplay(id: string): Promise<Replay> {",
      "  const response = await fetch(`/api/replay/${id}`);",
      "  if (!response.ok) {",
      "    throw new Error(`request_failed:${response.status}`);",
      "  }",
      "  return response.json();",
      "}",
    ],
    [
      "const visibleRows = rows",
      "  .filter((row) => row.certified || showPractice)",
      "  .sort((a, b) => b.wpm - a.wpm)",
      "  .slice(0, limit);",
    ],
    [
      "function clamp(value: number, min: number, max: number): number {",
      "  return Math.min(max, Math.max(min, value));",
      "}",
    ],
    [
      "const payload = {",
      "  mode,",
      "  durationMs: Math.round(elapsed * 1000),",
      "  telemetry: collectTelemetry(events),",
      "};",
    ],
  ],
  python: [
    [
      "async def load_replay(replay_id: str) -> dict:",
      "    response = await client.get(f\"/api/replay/{replay_id}\")",
      "    response.raise_for_status()",
      "    return response.json()",
    ],
    [
      "def clamp(value: float, minimum: float, maximum: float) -> float:",
      "    return min(maximum, max(minimum, value))",
    ],
    [
      "rows = [",
      "    item.label",
      "    for item in items",
      "    if item.active and item.score > threshold",
      "]",
    ],
    [
      "for index, word in enumerate(words):",
      "    if word.startswith(prefix):",
      "        matches.append((index, word))",
    ],
    [
      "with open(path, \"r\", encoding=\"utf-8\") as handle:",
      "    lines = [line.strip() for line in handle]",
    ],
  ],
  rust: [
    [
      "pub async fn load_replay(id: &str) -> Result<Replay, Error> {",
      "    let url = format!(\"/api/replay/{id}\");",
      "    let response = client.get(url).send().await?;",
      "    response.json::<Replay>().await",
      "}",
    ],
    [
      "let next: Vec<_> = items",
      "    .iter()",
      "    .filter(|item| item.active)",
      "    .map(|item| item.label.clone())",
      "    .collect();",
    ],
    [
      "match mode {",
      "    Mode::Chart => commit_on_beat(word, timing),",
      "    Mode::Code => submit_token(word),",
      "    _ => submit_word(word),",
      "}",
    ],
    [
      "if let Some(target) = targets.get_mut(index) {",
      "    target.health = target.health.saturating_sub(hit);",
      "}",
    ],
  ],
  sql: [
    [
      "SELECT handle, wpm, accuracy",
      "FROM leaderboard_scores",
      "WHERE mode = ? AND certified = 1",
      "ORDER BY wpm DESC, accuracy DESC",
      "LIMIT 25;",
    ],
    [
      "INSERT INTO replay_shares (id, account_id, replay_json)",
      "VALUES (?, ?, ?)",
      "ON CONFLICT(id) DO UPDATE SET replay_json = excluded.replay_json;",
    ],
    [
      "WITH ranked AS (",
      "  SELECT username, MAX(wpm) AS best_wpm",
      "  FROM leaderboard_scores",
      "  GROUP BY username",
      ")",
      "SELECT * FROM ranked ORDER BY best_wpm DESC;",
    ],
    [
      "UPDATE account_profiles",
      "SET rating = rating + ?",
      "WHERE id = ? AND deleted_at IS NULL;",
    ],
  ],
};

export function tokenizeCodeLine(line: string): string[] {
  return (
    line.match(
      /[A-Za-z_][A-Za-z0-9_]*|===|!==|==|!=|=>|->|::|<=|>=|&&|\|\||[{}()[\].,;:+\-*/<>?=]|"[^"]*"|'[^']*'|`[^`]*`|\d+/g,
    ) ?? []
  );
}

export function generateCodePrompt(language: CodeLanguage, indentMode: CodeIndentMode, count: number): CodePrompt {
  const tokens: string[] = [];
  const lineStarts: Record<number, number> = {};
  while (tokens.length < count) {
    const snippets = CODE_SNIPPETS[language];
    const snippet = snippets[Math.floor(Math.random() * snippets.length)] ?? snippets[0] ?? [];
    for (const line of snippet) {
      if (tokens.length >= count) break;
      const indent = indentMode === "preserve" ? Math.floor((line.match(/^\s*/)?.[0].length ?? 0) / 2) : 0;
      const lineTokens = tokenizeCodeLine(line);
      if (lineTokens.length === 0) continue;
      lineStarts[tokens.length] = indent;
      for (const token of lineTokens) {
        if (tokens.length >= count) break;
        tokens.push(token);
      }
    }
  }
  return { tokens, lineStarts };
}
