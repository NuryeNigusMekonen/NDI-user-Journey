-- Manual cases for the reference-data pipeline (M-20..M-24).
--
-- The plan had no case touching the pipeline at all, because it was written against db-replacing.
-- Staging runs version1, where the whole fetch -> S3 -> stage -> human gate -> promote flow is live
-- and visibly in use (11 sources tracked, 7 in PENDING_REVIEW, PU-32 held on a failed validation).
--
-- This stage decides which numbers the engines use. An unreviewed promotion moves every remediation
-- figure at once, which makes the human gate the highest-leverage thing a person can test here --
-- and none of it was covered.
--
-- M-22 is the one worth reading: approve() REFUSES a one-click approval while a pending update
-- carries unacknowledged validation warnings, forcing the reviewer to look and re-approve with
-- acknowledge_warnings=true. A test plan that never exercises that gate cannot claim the
-- reproducibility backbone is safe.

insert into public.test_manual_cases (case_id, area, title, steps, expected, priority, sort_order)
select * from (values
 ('M-20','Pipeline','Pipeline dashboard reports real source health',
  '1) Sign in as ADMIN 2) Open Data pipeline 3) Compare the header stats against the Recent runs table 4) Cross-check a source''s fetched size and timestamp',
  'Sources tracked, fetch success rate, pending count, promoted count and open circuits all agree with the runs listed below them. Each run shows its source, state, phase, bytes fetched and outcome. A failed fetch is visible as a row, never hidden by a healthy-looking average.',
  'High',20),
 ('M-21','Pipeline','A schema-drift halt stages nothing',
  '1) Find a run whose outcome is SCHEMA_DRIFT_HALT (onet, Jul 16) 2) Open the pending update it flagged 3) Check whether any staged rows reached the live reference tables 4) Open Reference data and confirm the ruler still serves the previous vintage',
  'The halted run staged NOTHING into production reference tables and flagged its pending update with the validation error. The live rulers keep serving the last approved vintage. A drifted upstream file can never silently reach an engine.',
  'High',21),
 ('M-22','Pipeline','Approve refuses a one-click approval on unacknowledged warnings',
  '1) Open a pending update that carries validation warnings (PU-32 onet, validation failed, 1 err) 2) Attempt to approve it without acknowledging the warnings 3) Read the refusal 4) Acknowledge the warnings and approve again',
  'The first approve is REFUSED with a message naming the first warning, and nothing is promoted. Only an explicit re-approval with acknowledge_warnings=true proceeds. A below-floor row count (a partial download) cannot be promoted by one click.',
  'High',22),
 ('M-23','Pipeline','Approve appends a new immutable methodology version',
  '1) Note the current methodology version and an existing completed run 2) Approve a pending update 3) Check the methodology list 4) Re-open the OLD run and confirm the number it reports',
  'Promotion appends a NEW immutable methodology_version — it never edits the existing one. The older run still reports the same number against the vintage it was frozen with. Same census + same methodology version = the same number, forever.',
  'High',23),
 ('M-24','Pipeline','Hold and reject leave production untouched',
  '1) Hold a pending update with a hold_until timestamp 2) Confirm the live rulers are unchanged 3) Reject a different pending update with notes 4) Check the audit trail and the raw file provenance',
  'HOLD leaves the update in the queue and the live rulers unchanged. REJECT discards the candidate but keeps the raw fetched file in S3 and records who rejected it and why. Neither action alters production reference data.',
  'Medium',24)
) as seed(case_id, area, title, steps, expected, priority, sort_order)
where not exists (select 1 from public.test_manual_cases where case_id = 'M-20');
