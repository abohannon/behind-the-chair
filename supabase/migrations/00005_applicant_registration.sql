-- Both public roles may register. Invitations retain their assigned role;
-- metadata is consulted only once at creation, never for authorization later.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE assigned_role public.user_role;
BEGIN
 SELECT role INTO assigned_role FROM public.alpha_invites WHERE email=lower(NEW.email);
 IF assigned_role IS NULL THEN
   IF NEW.raw_user_meta_data->>'role' IS NOT NULL
      AND NEW.raw_user_meta_data->>'role' NOT IN ('employer','seeker') THEN
     RAISE EXCEPTION 'Choose a business or applicant account';
   END IF;
   assigned_role := COALESCE(NEW.raw_user_meta_data->>'role','employer')::public.user_role;
 END IF;
 INSERT INTO public.profiles(id,role,full_name) VALUES
 (NEW.id,assigned_role,COALESCE(NEW.raw_user_meta_data->>'full_name',''));
 RETURN NEW;
END $$;
