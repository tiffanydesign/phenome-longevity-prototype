import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBar, HomeIndicator } from "@/components/PhoneFrame";
import { GAMES } from "@/data/discover";
import { ChevronLeft } from "@/components/NavHeader";
import { Stopwatch } from "./icons";
import { canMove, initialBoard, move, spawn, type Board, type Dir } from "./game2048";
import "./GamePlay.css";

const ROUND_S = 240;
const hashQuery = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");
const MOVE_KEYS: Record<string, Dir> = { u: "up", d: "down", l: "left", r: "right" };

/**
 * Game in progress — captures: game_2048/playing, game_2048/playing_moves (4-minute round).
 * 2048 is playable (swipe / arrow keys); other games show a placeholder board.
 * Prototype hooks for compare shots: `?moves=ur` replays moves, `?t=224` sets the clock.
 */
export function GamePlayScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const game = GAMES.find((g) => g.id === id);
  const [left, setLeft] = useState(() => Number(hashQuery().get("t") ?? ROUND_S));

  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="gp">
      <StatusBar />
      <div className="gp-top">
        <button className="gp-back" aria-label="Back" onClick={() => nav(-1)}>
          <ChevronLeft size={20} />
        </button>
        <span className="gp-timer">
          <Stopwatch size={17} />
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      </div>
      {id === "2048" ? (
        <Play2048 over={left === 0} />
      ) : (
        <>
          {/* TODO(fidelity): only 2048 gameplay was captured; other games show a placeholder. */}
          <div className="gp-score">0</div>
          <div className="gp-board gp-placeholder">{game ? game.bold + game.rest : "Game"}</div>
          <p className="gp-hint">Coming soon in the prototype.</p>
        </>
      )}
      <HomeIndicator />
    </div>
  );
}

function Play2048({ over }: { over: boolean }) {
  const [state, setState] = useState(() => {
    let board: Board = initialBoard();
    let score = 0;
    let spawns = 0;
    for (const ch of hashQuery().get("moves") ?? "") {
      const d = MOVE_KEYS[ch];
      if (!d) continue;
      const r = move(board, d);
      if (!r.moved) continue;
      score += r.gained;
      board = spawn(r.board, spawns++);
    }
    return { board, score, spawns };
  });

  const doMove = useCallback(
    (d: Dir) => {
      if (over) return;
      setState((s) => {
        const r = move(s.board, d);
        if (!r.moved) return s;
        return { board: spawn(r.board, s.spawns), score: s.score + r.gained, spawns: s.spawns + 1 };
      });
    },
    [over],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = ({ ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" } as Record<string, Dir>)[e.key];
      if (d) {
        e.preventDefault();
        doMove(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  const start = useRef<{ x: number; y: number } | null>(null);
  const finished = over || !canMove(state.board);

  return (
    <>
      <div className="gp-score">{state.score}</div>
      <div
        className="gp-board"
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        }}
      >
        {state.board.flat().map((v, i) => (
          <span key={i} className="gp-tile" data-v={v || undefined}>
            {v || ""}
          </span>
        ))}
        {/* TODO(fidelity): game-over / time-up screen not captured */}
        {finished && <div className="gp-over">{over ? "Time's up!" : "No more moves"}</div>}
      </div>
      <p className="gp-hint">Swipe to move tiles. Merge same numbers!</p>
    </>
  );
}
