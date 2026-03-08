-- Fix: recursión infinita en profiles_update_own
-- La política original usaba una subquery directa sobre public.profiles
-- en el WITH CHECK, lo que causaba un ciclo al evaluar RLS de SELECT.
-- Solución: usar get_user_role() (SECURITY DEFINER) que bypassa RLS.

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = get_user_role()
  );
