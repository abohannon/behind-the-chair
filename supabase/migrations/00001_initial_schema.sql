-- ============================================================
-- Salon Job Board — Initial Schema
-- ============================================================

-- Enums
CREATE TYPE public.user_role AS ENUM ('employer', 'seeker');
CREATE TYPE public.job_type AS ENUM ('booth_rental', 'commission', 'salary', 'hourly');
CREATE TYPE public.experience_level AS ENUM ('entry', 'mid', 'senior');
CREATE TYPE public.job_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.application_status AS ENUM ('submitted', 'reviewed', 'interview', 'rejected', 'hired');
CREATE TYPE public.payment_type AS ENUM ('single_post');

-- ============================================================
-- Tables
-- ============================================================

-- profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  profile_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- employer_profiles
CREATE TABLE public.employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_name text NOT NULL,
  location_city text NOT NULL,
  location_state text NOT NULL,
  description text NOT NULL,
  website_url text,
  instagram_handle text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- seeker_profiles
CREATE TABLE public.seeker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline text,
  bio text,
  resume_url text,
  portfolio_url text,
  instagram_handle text,
  city text,
  state text,
  specialties jsonb DEFAULT '[]'::jsonb,
  years_experience integer,
  open_to_work boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- job_posts
CREATE TABLE public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  job_type public.job_type NOT NULL,
  experience_level public.experience_level NOT NULL,
  category text NOT NULL,
  specialties jsonb DEFAULT '[]'::jsonb,
  city text NOT NULL,
  state text NOT NULL,
  pay_range_low integer,
  pay_range_high integer,
  status public.job_status NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- applications
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  seeker_id uuid NOT NULL REFERENCES public.seeker_profiles(id) ON DELETE CASCADE,
  cover_letter text,
  status public.application_status NOT NULL DEFAULT 'submitted',
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_post_id, seeker_id)
);

-- payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  job_post_id uuid NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  stripe_payment_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  type public.payment_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_job_posts_status_posted ON public.job_posts(status, posted_at DESC);
CREATE INDEX idx_job_posts_employer ON public.job_posts(employer_id);
CREATE INDEX idx_applications_job_post ON public.applications(job_post_id);
CREATE INDEX idx_applications_seeker ON public.applications(seeker_id);
CREATE INDEX idx_payments_stripe_id ON public.payments(stripe_payment_id);

-- ============================================================
-- updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_seeker_profiles_updated_at
  BEFORE UPDATE ON public.seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Profile creation trigger (on auth.users insert)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- employer_profiles
CREATE POLICY "Anyone can view employer profiles"
  ON public.employer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Employers can insert own profile"
  ON public.employer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update own profile"
  ON public.employer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can delete own profile"
  ON public.employer_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- seeker_profiles
CREATE POLICY "Authenticated users can view seeker profiles"
  ON public.seeker_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Seekers can insert own profile"
  ON public.seeker_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Seekers can update own profile"
  ON public.seeker_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Seekers can delete own profile"
  ON public.seeker_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- job_posts
CREATE POLICY "Anyone can view active jobs"
  ON public.job_posts FOR SELECT
  USING (
    status = 'active'
    OR employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can insert jobs"
  ON public.job_posts FOR INSERT
  WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update own jobs"
  ON public.job_posts FOR UPDATE
  USING (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can delete own jobs"
  ON public.job_posts FOR DELETE
  USING (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

-- applications
CREATE POLICY "Seekers can view own applications"
  ON public.applications FOR SELECT
  USING (
    seeker_id IN (
      SELECT id FROM public.seeker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications FOR SELECT
  USING (
    job_post_id IN (
      SELECT jp.id FROM public.job_posts jp
      JOIN public.employer_profiles ep ON jp.employer_id = ep.id
      WHERE ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Seekers can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    seeker_id IN (
      SELECT id FROM public.seeker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update applications for their jobs"
  ON public.applications FOR UPDATE
  USING (
    job_post_id IN (
      SELECT jp.id FROM public.job_posts jp
      JOIN public.employer_profiles ep ON jp.employer_id = ep.id
      WHERE ep.user_id = auth.uid()
    )
  )
  WITH CHECK (
    job_post_id IN (
      SELECT jp.id FROM public.job_posts jp
      JOIN public.employer_profiles ep ON jp.employer_id = ep.id
      WHERE ep.user_id = auth.uid()
    )
  );

-- payments
CREATE POLICY "Employers can view own payments"
  ON public.payments FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

-- payments INSERT is service-role only (no policy needed — RLS blocks all non-service-role inserts)
