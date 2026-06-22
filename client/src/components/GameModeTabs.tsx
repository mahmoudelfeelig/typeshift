import Link from "next/link";
import type { Mode } from "../lib/api";
import { GAME_MODES, MODE_META, pathForMode } from "../lib/game-modes";

interface GameModeTabsProps {
  activeMode: Mode;
  onPreviewMode?: (mode: Mode) => void;
}

export default function GameModeTabs({ activeMode, onPreviewMode }: GameModeTabsProps) {
  return (
    <section className="game-tabs-panel" aria-label="Game modes">
      <div className="game-tabs">
        {GAME_MODES.map((gameMode) => (
          <Link
            key={`game-tab-${gameMode}`}
            href={pathForMode(gameMode)}
            className={`game-tab ${activeMode === gameMode ? "active" : ""}`}
            aria-current={activeMode === gameMode ? "page" : undefined}
            onMouseEnter={() => onPreviewMode?.(gameMode)}
            onFocus={() => onPreviewMode?.(gameMode)}
          >
            <span>{MODE_META[gameMode].label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
