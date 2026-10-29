import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet } from "@/components/Overlay";
import { useDataset } from "@/lib/data";
import { LEADERBOARD, myScoresData, type Game, type ScoreRow } from "@/data/discover";
import { Gamepad, Play } from "./icons";

/**
 * Game launch bottom sheet — captures: game_2048/top (My Scores, empty), game_2048/leaderboard.
 * Every game uses the same sheet; only the title changes.
 */
export function GameSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const nav = useNavigate();
  const [tab, setTab] = useState<"mine" | "global">("mine");
  const mine = useDataset(myScoresData);
  // TODO(fidelity): only 2048's leaderboard was captured; other games reuse it.
  const rows = tab === "mine" ? mine : LEADERBOARD;
  return (
    <Sheet open onClose={onClose} handle height={640}>
      <div className="gs">
        <h2 className="gs-title">{game.bold + game.rest}</h2>
        <div className="gs-tabs" role="tablist">
          <button role="tab" data-on={tab === "mine" || undefined} onClick={() => setTab("mine")}>
            My Scores
          </button>
          <button role="tab" data-on={tab === "global" || undefined} onClick={() => setTab("global")}>
            Global Leaderboard
          </button>
        </div>
        <div className="gs-body scroll">
          {rows.length === 0 ? (
            <div className="gs-empty">
              <Gamepad size={50} />
              <p className="gs-empty-title">No scores yet</p>
              <p className="gs-empty-sub">Play to get your first score!</p>
            </div>
          ) : (
            rows.map((r) => <Row key={`${r.rank}-${r.initials}`} r={r} />)
          )}
        </div>
        <button className="gs-play" onClick={() => nav(`/discover/games/${game.id}/play`)}>
          <Play size={15} /> Play Now
        </button>
      </div>
    </Sheet>
  );
}

function Row({ r }: { r: ScoreRow }) {
  const medal = r.rank <= 3 ? ` gs-medal-${r.rank}` : "";
  return (
    <div className={`gs-row${medal}`}>
      <span className="gs-rank">{r.rank}</span>
      <span className="gs-name">{r.initials}</span>
      <span className="gs-score">{r.score}</span>
    </div>
  );
}
