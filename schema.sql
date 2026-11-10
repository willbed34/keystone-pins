CREATE TABLE IF NOT EXISTS daily_scores (
  day TEXT NOT NULL,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (day, player_id)
);
CREATE INDEX IF NOT EXISTS daily_scores_day_idx ON daily_scores(day);