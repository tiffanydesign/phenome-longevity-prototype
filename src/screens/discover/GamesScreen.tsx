import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader, ChevronRight } from "@/components/NavHeader";
import { GAMES } from "@/data/discover";
import { GameSheet } from "./GameSheet";
import "./Games.css";

/**
 * Cognitive Games list — captures: games/top, games/scroll_1, games/scroll_2.
 * With :id the launch bottom sheet is open over the list (game_2048/top, leaderboard).
 */
export function GamesScreen() {
  const nav = useNavigate();
  const { id } = useParams();
  const game = GAMES.find((g) => g.id === id);
  return (
    <Screen
      header={
        <div className="gm-header">
          <NavHeader variant="arrow" title="Cognitive Games" />
        </div>
      }
      overlay={game && <GameSheet game={game} onClose={() => nav("/discover/games", { replace: true })} />}
    >
      <div className="gm">
        <h1 className="gm-h1">
          Your <b>Cognitive Data</b>
        </h1>
        <p className="gm-intro">
          Your cognitive habits and mental well-being impact your brain's health and performance, including its neural connections and function.
        </p>
        {GAMES.map((g) => (
          <button key={g.id} className="gm-card" onClick={() => nav(`/discover/games/${g.id}`)}>
            <span className="gm-card-text">
              <span className="gm-card-title">
                <b>{g.bold}</b>
                {g.rest}
              </span>
              <span className="gm-card-desc">{g.desc}</span>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </Screen>
  );
}
