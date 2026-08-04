import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardRow {
  id: string;
  name: string;
  score: number;
  totalMarks: number;
  accuracy: number;
}

export function useLeaderboard(limit = 6) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, score, total_marks, correct_answers, wrong_answers, unanswered, profiles(name)")
        .order("score", { ascending: false })
        .limit(limit);

      if (!active) return;

      if (error) {
        setRestricted(true);
        setLoading(false);
        return;
      }

      const mapped: LeaderboardRow[] = (data ?? []).map((row: any) => {
        const attempted = (row.correct_answers ?? 0) + (row.wrong_answers ?? 0);
        return {
          id: row.id,
          name: row.profiles?.name ?? "Aspirant",
          score: row.score ?? 0,
          totalMarks: row.total_marks ?? 0,
          accuracy: attempted > 0 ? Math.round(((row.correct_answers ?? 0) / attempted) * 100) : 0,
        };
      });

      setRows(mapped);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [limit]);

  return { rows, loading, restricted };
}
