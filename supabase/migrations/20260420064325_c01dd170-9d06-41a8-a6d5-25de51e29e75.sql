ALTER TABLE public.questions
  ALTER COLUMN marks TYPE numeric(10,2) USING marks::numeric,
  ALTER COLUMN negative_marks TYPE numeric(10,2) USING negative_marks::numeric;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS source_exam text,
  ADD COLUMN IF NOT EXISTS source_year integer,
  ADD COLUMN IF NOT EXISTS source_question_number text;

ALTER TABLE public.submissions
  ALTER COLUMN score TYPE numeric(10,2) USING score::numeric,
  ALTER COLUMN total_marks TYPE numeric(10,2) USING total_marks::numeric;

CREATE OR REPLACE FUNCTION public.submit_test(p_test_id uuid, p_answers jsonb, p_time_taken integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_score NUMERIC(10,2) := 0;
  v_correct INTEGER := 0;
  v_wrong INTEGER := 0;
  v_unanswered INTEGER := 0;
  v_total_marks NUMERIC(10,2) := 0;
  v_test_exists BOOLEAN;
  v_already_submitted BOOLEAN;
  v_question RECORD;
  v_selected TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.tests WHERE id = p_test_id AND status = 'published'
  ) INTO v_test_exists;

  IF NOT v_test_exists THEN
    RAISE EXCEPTION 'Test not found or not published';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.submissions WHERE test_id = p_test_id AND user_id = v_user_id
  ) INTO v_already_submitted;

  IF v_already_submitted THEN
    RAISE EXCEPTION 'Already submitted';
  END IF;

  FOR v_question IN
    SELECT id, correct_option, marks, negative_marks
    FROM public.questions
    WHERE test_id = p_test_id
  LOOP
    v_total_marks := v_total_marks + COALESCE(v_question.marks, 0);
    v_selected := p_answers ->> v_question.id::text;

    IF v_selected IS NULL OR v_selected = '' THEN
      v_unanswered := v_unanswered + 1;
    ELSIF v_question.correct_option IS NOT NULL AND UPPER(v_selected) = UPPER(v_question.correct_option) THEN
      v_correct := v_correct + 1;
      v_score := v_score + COALESCE(v_question.marks, 0);
    ELSIF v_question.correct_option IS NOT NULL THEN
      v_wrong := v_wrong + 1;
      v_score := v_score - COALESCE(v_question.negative_marks, 0);
    ELSE
      v_unanswered := v_unanswered + 1;
    END IF;
  END LOOP;

  IF v_score < 0 THEN
    v_score := 0;
  END IF;

  INSERT INTO public.submissions (test_id, user_id, score, total_marks, correct_answers, wrong_answers, unanswered, time_taken)
  VALUES (p_test_id, v_user_id, v_score, v_total_marks, v_correct, v_wrong, v_unanswered, p_time_taken);

  RETURN jsonb_build_object(
    'score', v_score,
    'total_marks', v_total_marks,
    'correct_answers', v_correct,
    'wrong_answers', v_wrong,
    'unanswered', v_unanswered
  );
END;
$function$;