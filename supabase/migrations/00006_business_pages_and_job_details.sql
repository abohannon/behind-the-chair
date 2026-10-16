-- Additive public business fields; no existing data is inferred or overwritten.
CREATE FUNCTION public.valid_business_hours(hours jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE day text; entry jsonb;
BEGIN
 IF hours IS NULL THEN RETURN true; END IF;
 IF jsonb_typeof(hours) <> 'object' THEN RETURN false; END IF;
 FOR day,entry IN SELECT * FROM jsonb_each(hours) LOOP
  IF day NOT IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') OR jsonb_typeof(entry) <> 'object' THEN RETURN false; END IF;
  IF entry->>'state' = 'closed' THEN
   IF entry <> '{"state":"closed"}'::jsonb THEN RETURN false; END IF;
  ELSIF entry->>'state' = 'open' THEN
   IF NOT (entry ?& ARRAY['state','opens','closes']) OR (entry - ARRAY['state','opens','closes']) <> '{}'::jsonb
    OR jsonb_typeof(entry->'opens') <> 'string' OR jsonb_typeof(entry->'closes') <> 'string'
    OR entry->>'opens' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR entry->>'closes' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    OR entry->>'opens' >= entry->>'closes' THEN RETURN false; END IF;
  ELSE RETURN false;
  END IF;
 END LOOP;
 RETURN true;
END $$;
ALTER TABLE public.employer_profiles
 ADD COLUMN street_address text CHECK (char_length(street_address) <= 250),
 ADD COLUMN operating_hours jsonb CHECK (public.valid_business_hours(operating_hours));
GRANT UPDATE(street_address,operating_hours) ON public.employer_profiles TO authenticated;
ALTER TABLE public.job_posts
 ADD COLUMN schedule_details text CHECK (char_length(schedule_details) <= 2000),
 ADD COLUMN benefits text CHECK (char_length(benefits) <= 4000),
 ADD COLUMN role_category text;
CREATE FUNCTION public.job_role_label(role text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT CASE role
 WHEN 'receptionist' THEN 'Receptionist'
 WHEN 'salon_manager' THEN 'Salon Manager'
 WHEN 'stylist_assistant' THEN 'Stylist Assistant'
 WHEN 'cut_stylist' THEN 'Cut Stylist'
 WHEN 'color_stylist' THEN 'Color Stylist'
 WHEN 'cut_color_stylist' THEN 'Cut/Color Stylist'
 WHEN 'nail_technician' THEN 'Nail Technician'
 WHEN 'esthetician' THEN 'Esthetician / Skin Specialist'
 WHEN 'lash_brow_specialist' THEN 'Lash / Brow Specialist'
 WHEN 'barber' THEN 'Barber'
 WHEN 'massage_body' THEN 'Massage / Body Professional'
 WHEN 'makeup_artist' THEN 'Makeup Artist'
 WHEN 'other' THEN 'Other'
 END
$$;
CREATE FUNCTION public.valid_job_role(role text, industry text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT role IS NULL OR CASE role
 WHEN 'receptionist' THEN true
 WHEN 'salon_manager' THEN true
 WHEN 'stylist_assistant' THEN industry IN ('Hair','Barbering')
 WHEN 'cut_stylist' THEN industry IN ('Hair')
 WHEN 'color_stylist' THEN industry IN ('Hair')
 WHEN 'cut_color_stylist' THEN industry IN ('Hair')
 WHEN 'nail_technician' THEN industry IN ('Nails')
 WHEN 'esthetician' THEN industry IN ('Skin & Facials')
 WHEN 'lash_brow_specialist' THEN industry IN ('Lashes & Brows')
 WHEN 'barber' THEN industry IN ('Barbering')
 WHEN 'massage_body' THEN industry IN ('Massage & Body')
 WHEN 'makeup_artist' THEN industry IN ('Makeup')
 WHEN 'other' THEN true
 ELSE false END
$$;
ALTER TABLE public.job_posts ADD CONSTRAINT valid_role_industry CHECK (public.valid_job_role(role_category,category));
GRANT UPDATE(schedule_details,benefits,role_category) ON public.job_posts TO authenticated;
-- Versioned to keep the previous deployment's RPC available during rollout.
CREATE FUNCTION public.search_jobs_v2(keyword text DEFAULT '', industry text DEFAULT '', job_role text DEFAULT '')
RETURNS SETOF public.job_posts LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT j.* FROM public.job_posts j JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE j.status='active' AND lower(j.city)='portland' AND upper(j.state)='OR'
 AND (industry='' OR j.category=industry)
 AND (job_role='' OR j.role_category=job_role)
 AND (keyword='' OR position(lower(keyword) IN lower(j.title || ' ' || j.description || ' ' || e.salon_name || ' ' || COALESCE(public.job_role_label(j.role_category),'') || ' ' || COALESCE(j.specialties::text,'')))>0)
$$;
REVOKE ALL ON FUNCTION public.search_jobs_v2 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs_v2 TO anon, authenticated;
