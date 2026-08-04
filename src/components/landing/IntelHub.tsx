import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Crown, LineChart, Sparkle, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useLeaderboard } from "@/hooks/useLeaderboard";

type ExamKey = "jee-main" | "jee-advanced" | "neet" | "nda";

const EXAMS: Record<ExamKey, { label: string; max: number; pool: number; anchors: [number, number][] }> = {
  "jee-main": {
    label: "JEE Main",
    max: 300,
    pool: 1250000,
    anchors: [[0, 0], [30, 55], [50, 75], [70, 86], [90, 93], [120, 97.5], [150, 99], [180, 99.5], [220, 99.9], [250, 99.98], [300, 100]],
  },
  "jee-advanced": {
    label: "JEE Advanced",
    max: 360,
    pool: 190000,
    anchors: [[0, 0], [30, 58], [60, 80], [100, 92], [150, 97.5], [200, 99.3], [250, 99.9], [360, 100]],
  },
  neet: {
    label: "NEET UG",
    max: 720,
    pool: 2300000,
    anchors: [[0, 0], [100, 45], [200, 70], [300, 85], [400, 93], [500, 97.5], [600, 99.5], [650, 99.9], [720, 100]],
  },
  nda: {
    label: "NDA (Written)",
    max: 900,
    pool: 400000,
    anchors: [[0, 0], [150, 40], [250, 62], [350, 80], [450, 91], [550, 96.5], [650, 99], [900, 100]],
  },
};

function interpolate(anchors: [number, number][], marks: number) {
  for (let i = 1; i < anchors.length; i++) {
    const [x0, y0] = anchors[i - 1];
    const [x1, y1] = anchors[i];
    if (marks <= x1) {
      const t = x1 === x0 ? 0 : (marks - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return 100;
}

export function IntelHub() {
  const [exam, setExam] = useState<ExamKey>("jee-main");
  const [marks, setMarks] = useState(120);
  const { rows, loading, restricted } = useLeaderboard(6);

  const config = EXAMS[exam];
  const result = useMemo(() => {
    const clamped = Math.min(Math.max(marks, 0), config.max);
    const percentile = interpolate(config.anchors, clamped);
    const rank = Math.max(1, Math.round(((100 - percentile) / 100) * config.pool));
    return { percentile, rank, clamped };
  }, [marks, config]);

  const changeExam = (key: ExamKey) => {
    setExam(key);
    setMarks(Math.round(EXAMS[key].max * 0.4));
  };

  return (
    <section id="intel" className="relative py-24 bg-gradient-hero overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 grid-lines opacity-50" />

      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl mb-14">
          <span className="tracking-widest-xs text-accent">Rank Intelligence</span>
          <h2 className="mt-4 font-tech text-3xl md:text-5xl font-extrabold uppercase text-hero-foreground leading-[1.1]">
            Know your rank
            <span className="text-gradient neon-text"> before the exam does</span>
          </h2>
          <p className="mt-4 text-hero-foreground/70">
            Model your score against real exam pools, then watch the live scoreboard from every attempt on the platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Predictor */}
          <div className="lg:col-span-3 neo-panel-dark neon-border p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkle className="w-4 h-4 text-accent" />
              <span className="tracking-widest-xs text-hero-foreground/70">AI Rank Predictor</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {(Object.keys(EXAMS) as ExamKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => changeExam(key)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    exam === key
                      ? "bg-primary text-primary-foreground border-primary shadow-glow"
                      : "border-primary/25 text-hero-foreground/70 hover:border-primary/50 hover:text-hero-foreground"
                  }`}
                >
                  {EXAMS[key].label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-end">
              <div>
                <label className="tracking-widest-xs text-hero-foreground/50">Expected score (out of {config.max})</label>
                <Slider
                  className="mt-5"
                  value={[result.clamped]}
                  max={config.max}
                  step={1}
                  onValueChange={([v]) => setMarks(v)}
                />
              </div>
              <Input
                type="number"
                value={marks}
                min={0}
                max={config.max}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-28 bg-primary/10 border-primary/30 text-hero-foreground font-tech text-lg"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5">
                <div className="tracking-widest-xs text-hero-foreground/50">Percentile</div>
                <div className="mt-2 font-tech text-3xl font-bold text-accent">{result.percentile.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5">
                <div className="tracking-widest-xs text-hero-foreground/50">Projected AIR</div>
                <div className="mt-2 font-tech text-3xl font-bold text-hero-foreground">
                  {result.rank.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5">
                <div className="tracking-widest-xs text-hero-foreground/50">Candidate pool</div>
                <div className="mt-2 font-tech text-3xl font-bold text-hero-foreground">
                  {(config.pool / 100000).toFixed(1)}L
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs text-hero-foreground/40">
              Projection modelled on published percentile-vs-marks curves for {config.label}. Take a full mock to
              replace this estimate with your actual platform percentile.
            </p>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2 neo-panel-dark p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="tracking-widest-xs text-hero-foreground/70">Live Scoreboard</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-primary/10 animate-pulse" />
                ))}
              </div>
            ) : rows.length > 0 ? (
              <ul className="space-y-3">
                {rows.map((row, i) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-4 rounded-xl border border-primary/15 bg-primary/5 p-4"
                  >
                    <span className="font-tech text-sm text-accent w-6">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-hero-foreground truncate">{row.name}</p>
                      <p className="text-xs text-hero-foreground/50">{row.accuracy}% accuracy</p>
                    </div>
                    <span className="font-tech text-sm text-hero-foreground">
                      {row.score}
                      <span className="text-hero-foreground/40">/{row.totalMarks}</span>
                    </span>
                    {i === 0 && <Crown className="w-4 h-4 text-accent" />}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-6 text-center">
                <LineChart className="w-6 h-6 text-accent mx-auto mb-3" />
                <p className="text-sm text-hero-foreground/70">
                  {restricted
                    ? "Scoreboard is visible to signed-in members of the academy."
                    : "No attempts recorded yet — the scoreboard fills up with the first submitted paper."}
                </p>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="mt-4 rounded-full border-primary/40 bg-transparent text-hero-foreground hover:bg-primary/10">
                    Sign in to view
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
