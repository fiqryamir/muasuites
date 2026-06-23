
DECLARE
  v_base_slug TEXT;
  v_final_slug TEXT;
  v_counter INT := 0;
BEGIN
  -- Extract prefix of email as initial slug proposal
  v_base_slug := split_part(new.email, '@', 1);
  v_base_slug := regexp_replace(lower(v_base_slug), '[^a-z0-9_]', '', 'g');
  
  -- Handle rare cases where string becomes empty after cleaning
  IF v_base_slug = '' THEN
    v_base_slug := 'mua';
  END IF;

  v_final_slug := v_base_slug;

  -- Verify uniqueness loop to handle potential username collisions
  LOOP
    BEGIN
      INSERT INTO public.muas (id, email, slug)
      VALUES (new.id, new.email, v_final_slug);
      EXIT; -- Insert succeeded, break out of the loop
    EXCEPTION WHEN unique_violation THEN
      v_counter := v_counter + 1;
      v_final_slug := v_base_slug || v_counter::text;
    END;
  END LOOP;

  -- Create empty settings config linked to this MUA
  INSERT INTO public.mua_configs (mua_id)
  VALUES (new.id);
  
  RETURN new;
END;
