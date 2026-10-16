-- Forward-only alpha changes. Legacy applications remain readable; new submissions
-- must use submit_application so required fields/files are checked atomically.
ALTER TABLE public.seeker_profiles ADD COLUMN contact_email text, ADD COLUMN phone text;
ALTER TABLE public.employer_profiles ADD COLUMN photos jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.job_posts
  ADD COLUMN arrangement text NOT NULL DEFAULT 'employment' CHECK (arrangement IN ('employment','booth_rental')),
  ADD COLUMN schedule text NOT NULL DEFAULT 'flexible' CHECK (schedule IN ('full_time','part_time','flexible')),
  ADD COLUMN pay_unit text CHECK (pay_unit IN ('hour','year','week','month')),
  ADD COLUMN commission_percent numeric CHECK (commission_percent BETWEEN 0 AND 100);
UPDATE public.job_posts SET arrangement = 'booth_rental' WHERE job_type = 'booth_rental';
ALTER TABLE public.applications ADD COLUMN submitted_name text, ADD COLUMN contact_email text,
  ADD COLUMN phone text, ADD COLUMN resume_path text UNIQUE, ADD COLUMN resume_name text;
CREATE TABLE public.application_ratings (
  application_id uuid PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.application_ratings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_rating_updated_at BEFORE UPDATE ON public.application_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Small non-recursive helpers: never expose arbitrary data through SECURITY DEFINER.
CREATE FUNCTION public.has_role(expected public.user_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = expected)
$$;
CREATE FUNCTION public.owns_job(job_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.job_posts j JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE j.id=job_id AND e.user_id=auth.uid())
$$;
CREATE FUNCTION public.applied_to_job(job_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications a JOIN public.seeker_profiles s ON s.id=a.seeker_id
 WHERE a.job_post_id=job_id AND s.user_id=auth.uid())
$$;
CREATE FUNCTION public.can_review_applicant(applicant_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications a
 JOIN public.seeker_profiles s ON s.id=a.seeker_id
 JOIN public.job_posts j ON j.id=a.job_post_id
 JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE s.user_id=applicant_user AND e.user_id=auth.uid())
$$;
CREATE FUNCTION public.owns_application(application uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications a JOIN public.job_posts j ON j.id=a.job_post_id
 JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE a.id=application AND e.user_id=auth.uid())
$$;
CREATE FUNCTION public.resume_submitted(path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications WHERE resume_path=path)
$$;
CREATE FUNCTION public.can_read_resume(path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.applications a JOIN public.job_posts j ON j.id=a.job_post_id
 JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE a.resume_path=path AND e.user_id=auth.uid())
$$;
REVOKE ALL ON FUNCTION public.has_role, public.owns_job, public.applied_to_job,
 public.can_review_applicant, public.owns_application, public.resume_submitted, public.can_read_resume FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role, public.owns_job, public.applied_to_job,
 public.can_review_applicant, public.owns_application, public.resume_submitted, public.can_read_resume TO authenticated;
-- Anonymous job policy evaluates owns_job/applied_to_job too.
GRANT EXECUTE ON FUNCTION public.owns_job, public.applied_to_job TO anon;

DROP POLICY "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Own or relevant applicant profile" ON public.profiles FOR SELECT TO authenticated
 USING (id=auth.uid() OR public.can_review_applicant(id));
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE(full_name, avatar_url, profile_complete) ON public.profiles TO authenticated;
-- Trusted invitation registry is service-role-only; invitation metadata is user-editable.
CREATE TABLE public.alpha_invites (email text PRIMARY KEY, role public.user_role NOT NULL);
ALTER TABLE public.alpha_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.alpha_invites FROM anon, authenticated;
GRANT ALL ON public.alpha_invites TO service_role;
-- Roles originate from trusted invitations, never user-editable metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.alpha_invites WHERE email=lower(NEW.email)) THEN
   RAISE EXCEPTION 'An invitation with an assigned role is required';
 END IF;
 INSERT INTO public.profiles(id,role,full_name) VALUES
 (NEW.id,(SELECT role FROM public.alpha_invites WHERE email=lower(NEW.email)),COALESCE(NEW.raw_user_meta_data->>'full_name',''));
 RETURN NEW;
END $$;
DROP POLICY "Authenticated users can view seeker profiles" ON public.seeker_profiles;
CREATE POLICY "Own or relevant seeker" ON public.seeker_profiles FOR SELECT TO authenticated
 USING (user_id=auth.uid() OR public.can_review_applicant(user_id));
DROP POLICY "Seekers can insert own profile" ON public.seeker_profiles;
CREATE POLICY "Seeker creates own profile" ON public.seeker_profiles FOR INSERT TO authenticated
 WITH CHECK(user_id=auth.uid() AND public.has_role('seeker'));
DROP POLICY "Employers can insert own profile" ON public.employer_profiles;
CREATE POLICY "Employer creates own profile" ON public.employer_profiles FOR INSERT TO authenticated
 WITH CHECK(user_id=auth.uid() AND public.has_role('employer'));
-- Identity and role columns cannot be rewritten through a direct REST update.
REVOKE UPDATE ON public.seeker_profiles FROM authenticated;
GRANT UPDATE(headline,bio,portfolio_url,instagram_handle,city,state,specialties,years_experience,open_to_work,contact_email,phone)
 ON public.seeker_profiles TO authenticated;
REVOKE UPDATE ON public.employer_profiles FROM authenticated;
GRANT UPDATE(salon_name,location_city,location_state,description,website_url,instagram_handle,logo_url,photos)
 ON public.employer_profiles TO authenticated;
DROP POLICY "Anyone can view active jobs" ON public.job_posts;
CREATE POLICY "Public active or related jobs" ON public.job_posts FOR SELECT
 USING(status='active' OR employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id=auth.uid()) OR public.applied_to_job(id));
REVOKE UPDATE ON public.job_posts FROM authenticated;
GRANT UPDATE(title,description,job_type,experience_level,category,specialties,city,state,pay_range_low,pay_range_high,arrangement,schedule,pay_unit,commission_percent)
 ON public.job_posts TO authenticated;
-- All inserts must start as a Portland draft, including direct REST inserts.
DROP POLICY "Employers can insert jobs" ON public.job_posts;
CREATE POLICY "Employer creates Portland draft" ON public.job_posts FOR INSERT TO authenticated
 WITH CHECK(public.has_role('employer') AND status='draft' AND lower(trim(city))='portland' AND upper(trim(state))='OR'
 AND employer_id IN (SELECT id FROM public.employer_profiles WHERE user_id=auth.uid()));
ALTER TABLE public.job_posts ADD CONSTRAINT alpha_job_pay CHECK
 ((pay_range_low IS NULL OR pay_range_low>=0) AND (pay_range_high IS NULL OR pay_range_high>=0)
 AND (pay_range_low IS NULL OR pay_range_high IS NULL OR pay_range_low<=pay_range_high)) NOT VALID;

DROP POLICY "Seekers can insert applications" ON public.applications;
REVOKE INSERT, UPDATE, DELETE ON public.applications FROM anon, authenticated;
GRANT UPDATE(status) ON public.applications TO authenticated;
CREATE POLICY "Owner manages private ratings" ON public.application_ratings FOR ALL TO authenticated
 USING(public.owns_application(application_id)) WITH CHECK(public.owns_application(application_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.application_ratings TO authenticated;
REVOKE ALL ON public.application_ratings FROM anon;

CREATE FUNCTION public.set_job_status(job_id uuid, new_status public.job_status) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE j public.job_posts;
BEGIN
 SELECT * INTO j FROM public.job_posts WHERE id=job_id FOR UPDATE;
 IF NOT public.owns_job(job_id) THEN RAISE EXCEPTION 'Job not found'; END IF;
 IF new_status NOT IN ('active','closed') THEN RAISE EXCEPTION 'Invalid transition'; END IF;
 IF new_status='active' AND (trim(j.title)='' OR trim(j.description)='' OR lower(trim(j.city))<>'portland' OR upper(trim(j.state))<>'OR')
 THEN RAISE EXCEPTION 'Complete the Portland listing before publishing'; END IF;
 UPDATE public.job_posts SET status=new_status, posted_at=CASE WHEN new_status='active' THEN now() ELSE posted_at END,
 expires_at=NULL WHERE id=job_id;
END $$;
REVOKE ALL ON FUNCTION public.set_job_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_job_status TO authenticated;

CREATE FUNCTION public.submit_application(job_id uuid, applicant_name text, email text, telephone text, letter text, file_path text, file_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE seeker uuid; result uuid;
BEGIN
 IF NOT public.has_role('seeker') THEN RAISE EXCEPTION 'An applicant account is required'; END IF;
 -- Serialize against closing a job, and check status inside the transaction.
 PERFORM 1 FROM public.job_posts WHERE id=job_id AND status='active' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'This job is no longer accepting applications'; END IF;
 SELECT id INTO seeker FROM public.seeker_profiles WHERE user_id=auth.uid();
 IF seeker IS NULL THEN RAISE EXCEPTION 'Save your profile first'; END IF;
 IF length(trim(applicant_name)) NOT BETWEEN 1 AND 200 OR email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 OR length(regexp_replace(telephone,'[^0-9]','','g')) NOT BETWEEN 7 AND 15
 OR length(COALESCE(letter,''))>5000 OR applicant_name IS NULL OR email IS NULL OR telephone IS NULL
 THEN RAISE EXCEPTION 'Name, valid email and phone are required'; END IF;
 IF file_path IS NULL OR file_name IS NULL OR length(file_name)>255 OR NOT EXISTS
 (SELECT 1 FROM storage.objects WHERE bucket_id='resumes' AND name=file_path AND (storage.foldername(name))[1]=auth.uid()::text
 AND metadata->>'mimetype'='application/pdf' AND (metadata->>'size')::bigint BETWEEN 1 AND 10485760)
 THEN RAISE EXCEPTION 'Upload a PDF resume first'; END IF;
 INSERT INTO public.applications(job_post_id,seeker_id,submitted_name,contact_email,phone,cover_letter,resume_path,resume_name)
 VALUES(job_id,seeker,trim(applicant_name),trim(email),trim(telephone),NULLIF(trim(letter),''),file_path,file_name) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.submit_application FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_application TO authenticated;

DROP POLICY "Resume owners can manage" ON storage.objects;
DROP POLICY "Employers can read resumes" ON storage.objects;
CREATE POLICY "Owner reads resume" ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='resumes' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "Recipient reads submitted resume" ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='resumes' AND public.can_read_resume(name));
CREATE POLICY "Applicant uploads unique resume" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK(bucket_id='resumes' AND public.has_role('seeker') AND (storage.foldername(name))[1]=auth.uid()::text
 AND NOT public.resume_submitted(name));
CREATE POLICY "Owner removes unused resume" ON storage.objects FOR DELETE TO authenticated
 USING(bucket_id='resumes' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT public.resume_submitted(name));
UPDATE storage.buckets SET file_size_limit=10485760,allowed_mime_types=ARRAY['application/pdf'] WHERE id='resumes';
UPDATE storage.buckets SET file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'] WHERE id IN ('logos','avatars');
-- Business photos use the existing public logo bucket with unique owned paths.
ALTER TABLE public.employer_profiles ADD CONSTRAINT max_business_photos CHECK(jsonb_typeof(photos)='array' AND jsonb_array_length(photos)<=5);
-- Upsert includes user_id in its UPDATE set; ownership policies require it to
-- remain auth.uid(), so this grants no ability to transfer another user's row.
GRANT UPDATE(user_id) ON public.seeker_profiles, public.employer_profiles TO authenticated;
REVOKE DELETE ON public.profiles, public.seeker_profiles, public.employer_profiles, public.job_posts FROM authenticated;
CREATE FUNCTION public.search_jobs(keyword text DEFAULT '', industry text DEFAULT '')
RETURNS SETOF public.job_posts LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT j.* FROM public.job_posts j JOIN public.employer_profiles e ON e.id=j.employer_id
 WHERE j.status='active' AND lower(j.city)='portland' AND upper(j.state)='OR'
 AND (industry='' OR j.category=industry)
 AND (keyword='' OR position(lower(keyword) IN lower(j.title || ' ' || j.description || ' ' || e.salon_name))>0)
$$;
REVOKE ALL ON FUNCTION public.search_jobs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs TO anon, authenticated;
