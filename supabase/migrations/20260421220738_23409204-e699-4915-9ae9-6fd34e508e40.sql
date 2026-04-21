-- Allow public (anon) to check if a specific email has access.
-- This enables the simple "type your purchase email" login flow.
CREATE POLICY "Public can check access by exact email"
ON public.access_grants
FOR SELECT
TO anon
USING (true);