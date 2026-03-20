
-- Create a secure server-side function to submit test answers and calculate scores
CREATE OR REPLACE FUNCTION public.submit_test(
  p_test_id UUID,
  p_answers JSONB,
  p_time_taken INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_score INTEGER := 0;
  v_correct INTEGER := 0;
  v_wrong INTEGER := 0;
  v_unanswered INTEGER := 0;
  v_total_marks INTEGER := 0;
  v_test_exists BOOLEAN;
  v_already_submitted BOOLEAN;
  v_question RECORD;
  v_selected TEXT;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify test exists and is published
  SELECT EXISTS(
    SELECT 1 FROM public.tests WHERE id = p_test_id AND status = 'published'
  ) INTO v_test_exists;
  
  IF NOT v_test_exists THEN
    RAISE EXCEPTION 'Test not found or not published';
  END IF;

  -- Check for duplicate submission
  SELECT EXISTS(
    SELECT 1 FROM public.submissions WHERE test_id = p_test_id AND user_id = v_user_id
  ) INTO v_already_submitted;
  
  IF v_already_submitted THEN
    RAISE EXCEPTION 'Already submitted';
  END IF;

  -- Calculate score server-side
  FOR v_question IN
    SELECT id, correct_option, marks, negative_marks
    FROM public.questions
    WHERE test_id = p_test_id
  LOOP
    v_total_marks := v_total_marks + v_question.marks;
    v_selected := p_answers ->> v_question.id::text;
    
    IF v_selected IS NULL OR v_selected = '' THEN
      v_unanswered := v_unanswered + 1;
    ELSIF v_question.correct_option IS NOT NULL AND UPPER(v_selected) = UPPER(v_question.correct_option) THEN
      v_correct := v_correct + 1;
      v_score := v_score + v_question.marks;
    ELSIF v_question.correct_option IS NOT NULL THEN
      v_wrong := v_wrong + 1;
      v_score := v_score - v_question.negative_marks;
    ELSE
      v_unanswered := v_unanswered + 1;
    END IF;
  END LOOP;

  -- Clamp score to 0
  IF v_score < 0 THEN
    v_score := 0;
  END IF;

  -- Insert submission
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
$$;
