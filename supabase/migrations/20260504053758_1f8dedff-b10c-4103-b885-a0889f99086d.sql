-- Add support for numerical answers (questions without MCQ options)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS correct_answer text,
  ADD COLUMN IF NOT EXISTS answer_tolerance numeric DEFAULT 0;

-- Update submit_test to grade numerical answers as well
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
  v_user_num NUMERIC;
  v_correct_num NUMERIC;
  v_is_correct BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.tests WHERE id = p_test_id AND status = 'published') INTO v_test_exists;
  IF NOT v_test_exists THEN
    RAISE EXCEPTION 'Test not found or not published';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.submissions WHERE test_id = p_test_id AND user_id = v_user_id) INTO v_already_submitted;
  IF v_already_submitted THEN
    RAISE EXCEPTION 'Already submitted';
  END IF;

  FOR v_question IN
    SELECT id, correct_option, correct_answer, answer_tolerance, marks, negative_marks
    FROM public.questions
    WHERE test_id = p_test_id
  LOOP
    v_total_marks := v_total_marks + COALESCE(v_question.marks, 0);
    v_selected := p_answers ->> v_question.id::text;
    v_is_correct := false;

    IF v_selected IS NULL OR v_selected = '' THEN
      v_unanswered := v_unanswered + 1;
      CONTINUE;
    END IF;

    IF v_question.correct_option IS NOT NULL THEN
      IF UPPER(v_selected) = UPPER(v_question.correct_option) THEN
        v_is_correct := true;
      END IF;
    ELSIF v_question.correct_answer IS NOT NULL AND v_question.correct_answer <> '' THEN
      BEGIN
        v_user_num := v_selected::numeric;
        v_correct_num := v_question.correct_answer::numeric;
        IF ABS(v_user_num - v_correct_num) <= COALESCE(v_question.answer_tolerance, 0) THEN
          v_is_correct := true;
        END IF;
      EXCEPTION WHEN others THEN
        IF TRIM(LOWER(v_selected)) = TRIM(LOWER(v_question.correct_answer)) THEN
          v_is_correct := true;
        END IF;
      END;
    ELSE
      -- No answer key set, treat as unanswered for scoring
      v_unanswered := v_unanswered + 1;
      CONTINUE;
    END IF;

    IF v_is_correct THEN
      v_correct := v_correct + 1;
      v_score := v_score + COALESCE(v_question.marks, 0);
    ELSE
      v_wrong := v_wrong + 1;
      v_score := v_score - COALESCE(v_question.negative_marks, 0);
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