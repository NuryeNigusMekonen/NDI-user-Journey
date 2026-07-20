-- Allow testers to delete their own mistakes.
--
-- The run-log migration granted select/insert/update but not delete, so a row typed by accident
-- could be edited but never removed. The RLS policies are already `for all`, so only the grant
-- was missing. Still authenticated-only; anon has nothing.
grant delete on public.test_run_log  to authenticated;
grant delete on public.test_findings to authenticated;
