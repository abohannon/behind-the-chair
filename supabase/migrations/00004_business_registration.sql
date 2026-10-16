-- Uninvited accounts are businesses; trusted invitations retain their assigned
-- roles. User-editable metadata never assigns account privileges.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles(id,role,full_name) VALUES
 (NEW.id,COALESCE((SELECT role FROM public.alpha_invites WHERE email=lower(NEW.email)),
 'employer'::public.user_role),COALESCE(NEW.raw_user_meta_data->>'full_name',''));
 RETURN NEW;
END $$;
