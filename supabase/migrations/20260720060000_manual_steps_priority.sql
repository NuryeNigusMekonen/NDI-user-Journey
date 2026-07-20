-- Restructure the manual cases to the team's standard test-plan format:
--   ID | Area | Test Case | Steps | Expected Result | Priority
--
-- Two columns were missing and both matter to whoever actually runs these:
--   * Steps — we said WHAT to check but never HOW. A tester had to work out the click-path.
--     Written as a numbered sequence on one line, per the standard.
--   * Priority — only the non-functional cases carried one, so a tester could not tell which of
--     M-1..M-13 to run first.
update public.protected_content
set payload = jsonb_set(payload, '{manualCases}', '[
 {"id":"M-1","area":"Auth","case":"Login fail-closed","priority":"High",
  "steps":"1) Point the app at a database with no users 2) Open the login page 3) Attempt to sign in with any credentials",
  "expected":"Access denied. No default or fallback account exists — an empty user table admits nobody."},
 {"id":"M-2","area":"Upload","case":"Upload and verbatim preview","priority":"High",
  "steps":"1) Sign in 2) Upload clean_baseline.xlsx 3) Compare the preview against the source workbook",
  "expected":"Every one of the 59 columns appears exactly as written in the file — nothing normalized, renamed or dropped."},
 {"id":"M-3","area":"Review","case":"Flagged rows are visible and readable","priority":"High",
  "steps":"1) Upload edge_ingestion.xlsx 2) Open the review screen 3) Read the reason on each flagged row",
  "expected":"Every flagged and rejected row is listed with a reason a non-engineer can act on. The blank-Code row appears — it is never silently dropped."},
 {"id":"M-4","area":"Review","case":"Correction flow","priority":"High",
  "steps":"1) On a flagged row, correct the field 2) Save 3) Re-open the record 4) Run the analysis",
  "expected":"The correction persists, is written to the audit log, and the record re-derives. Snapshot status moves review to final only on run."},
 {"id":"M-5","area":"Output","case":"Verdict readability","priority":"High",
  "steps":"1) Run all_combined.xlsx 2) Open the result 3) Read it as a deal-team member would",
  "expected":"Remediation (A+B) and the per-plan healthcare pass/fail are clearly labelled and unambiguous — a reader can tell what the number means without asking."},
 {"id":"M-6","area":"Output","case":"Export into the acquisition model","priority":"Medium",
  "steps":"1) Open a completed run 2) Export 3) Paste into the acquisition model",
  "expected":"The structured output pastes cleanly, with columns landing where the model expects them."},
 {"id":"M-7","area":"Output","case":"Degraded run is visible","priority":"High",
  "steps":"1) Run edge_geo.xlsx, which contains an uncovered county 2) Open the result",
  "expected":"The UI shows the run as degraded. It never presents a partial basket as a full-confidence number."},
 {"id":"M-8","area":"Access","case":"ADVISOR run isolation","priority":"High",
  "steps":"1) Sign in as ADVISOR A and run a census 2) Sign in as ADVISOR B 3) Look for A''s run",
  "expected":"B cannot see A''s run in any list, and cannot open it by URL."},
 {"id":"M-9","area":"Access","case":"ADMIN full visibility","priority":"Medium",
  "steps":"1) Sign in as ADMIN 2) Open the runs list",
  "expected":"Every run is visible regardless of owner, including legacy runs."},
 {"id":"M-10","area":"Access","case":"Owner-only share management","priority":"High",
  "steps":"1) As the owner, share a run with another user 2) Sign in as that user 3) Attempt to add or remove a share",
  "expected":"The recipient can view the run but cannot change who else it is shared with."},
 {"id":"M-11","area":"Auth","case":"Invite and password-reset flows","priority":"Medium",
  "steps":"1) As ADMIN, invite a user 2) Accept via the invite link 3) Request a password reset 4) Re-use the old link",
  "expected":"Invite and reset links work once and then expire. An expired link fails with a clear message."},
 {"id":"M-12","area":"Reference","case":"Reference data screen","priority":"Medium",
  "steps":"1) Open the reference screen 2) Pick a basket component 3) Compare it against the published source",
  "expected":"Every external ruler (MIT, EPI, OEWS, PSL statutes, healthcare benchmarks) is shown as loaded, so a number can be checked against its source."},
 {"id":"M-13","area":"Reference","case":"Methodology versioning","priority":"High",
  "steps":"1) Note the current methodology version 2) Change a global default 3) Run an analysis 4) Check the version on the run",
  "expected":"A NEW immutable methodology version is frozen. The run records the version it used — the old snapshot is never silently reused."}
]'::jsonb),
updated_at = now()
where key = 'test_plan';
