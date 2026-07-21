-- Rewrite every edge-case description in plain English, and add the four that were missing.
--
-- The old text was engineer shorthand: "Defaults single + flag" says what happens but not what
-- went wrong, why the platform behaves that way, or what it would cost to get wrong. Someone
-- reviewing this page - a manager, a client, a new tester - cannot judge whether the coverage is
-- adequate from notation like that.
--
-- Each entry now answers three questions in order:
--   1. what the census actually contains (the messy real-world input)
--   2. what the platform must do about it
--   3. why it matters to the remediation number
--
-- Also adds E29-E32, which cover the rest of the SOC-derivation contract and had no entry at all,
-- and marks which cases have no generated row so a reader can see the real coverage.

update public.protected_content
set payload = jsonb_set(payload, '{edgeVariations}', '[
 {"group":"Stage 0 · Ingestion / normalization",
  "items":[
   {"id":"E1","variation":"Column headers written in shorthand",
    "expected":"A client may head a column \"Emp Cd\" or \"Exempt Y/N\" instead of the template wording. The platform matches headers twice - exact wording first, then partial - and checks the most specific pattern first so a loose match cannot steal a column from a precise one. NO GENERATED ROW: covered by parser unit tests instead."},
   {"id":"E2","variation":"Exempt status written as a single letter E or N",
    "expected":"Real payroll exports abbreviate. E means exempt (salaried, outside the Fair Pay mandate); N means non-exempt (hourly, in scope). Read backwards, salaried managers get pulled into the remediation cost or hourly workers get excluded from it - and the total looks perfectly normal either way."},
   {"id":"E3","variation":"A row with real pay data but no employee ID",
    "expected":"The row is FLAGGED AND REJECTED, and stays visible on screen with the reason. It is never quietly discarded. A dropped employee is a remediation figure that is wrong by exactly their gap, with nothing on screen to show anyone that a person went missing."},
   {"id":"E4","variation":"A completely blank row left in the spreadsheet",
    "expected":"Skipped silently as padding, with no flag. Spreadsheets routinely carry empty rows at the end of a range; flagging them would bury the real problems in noise. The distinction from E3 is the point: blank row = ignore, blank ID with data = reject loudly."},
   {"id":"E5","variation":"The same employee ID appears twice",
    "expected":"Both rows are kept and the second is renamed (ING-DUP becomes ING-DUP (2)). Neither is merged or overwritten. Two people sharing an ID is a client data-entry error, and silently keeping one would drop a real employee from the cost."},
   {"id":"E6","variation":"An HSA employer contribution sits next to the medical one",
    "expected":"HSA money is NOT counted as the employer''s medical premium contribution. They are different benefits in adjacent columns with similar names. Counting HSA money as premium support inflates the employer share and can flip a plan from failing the affordability screen to passing it."},
   {"id":"E7","variation":"An employee is enrolled but no coverage tier is recorded",
    "expected":"Defaults to single coverage - the CONSERVATIVE choice - and flags it. Single coverage assumes a smaller household, which produces a smaller cost-of-living basket. The platform would rather understate the household than invent dependents, and it says so on the record."},
   {"id":"E8","variation":"Exempt / non-exempt is left blank",
    "expected":"Defaults to NON-EXEMPT, so the employee stays IN remediation scope, and flags it. Including someone who may not belong overstates the cost, which a deal team will query. Excluding someone who does belong understates it, and nobody notices."},
   {"id":"E28","variation":"No SOC code supplied, but the job title is a real occupation",
    "expected":"The SOC code is derived from the title using the O*NET alternate-title table and marked as derived, not supplied. SOC selects which government wage data the employee is compared against, so this is what connects a job title to a prevailing wage."},
   {"id":"E29","variation":"Neither a SOC code nor a job title",
    "expected":"Nothing to work from, so the record is marked UNMATCHED and flagged - never given a plausible-looking placeholder code. A guessed occupation would compare the employee against the wrong pay scale, and the guess would be invisible."},
   {"id":"E30","variation":"An invented job title like \"Chief Happiness Ninja\"",
    "expected":"No occupation scores well enough to accept, so the record is routed to human review rather than forced onto the closest match. Companies invent titles constantly; the nearest O*NET occupation to a made-up title is often nothing like the actual role."},
   {"id":"E31","variation":"A bare, ambiguous title such as \"Manager\"",
    "expected":"When two occupations score almost equally, BOTH are surfaced with their confidence so a person can choose. The platform does not silently pick a winner. A manager could be retail, construction or finance, and those occupations have very different prevailing wages."},
   {"id":"E32","variation":"A supplied SOC code that contradicts the job title",
    "expected":"The census code WINS - the client is the source of record - but the disagreement with the title is flagged for review. A typo''d code would otherwise measure a nurse against a sales manager''s wages, with nothing indicating the mismatch."}
  ]},
 {"group":"Stage 0 · Geo / county resolution",
  "items":[
   {"id":"E9","variation":"The residence ZIP is missing or does not resolve",
    "expected":"Falls back down a documented ladder - the cost-centre work site, then the company home office - and names which rung it used. Cost of living is county-specific, so a missing address still needs a location; the platform picks one openly rather than skipping the employee."},
   {"id":"E10","variation":"A ZIP that straddles two or more counties",
    "expected":"The ZIP narrows it to a few candidate counties, then the engine prices the Fair Pay basket in each and scores against the MOST EXPENSIVE one. An ambiguous address therefore never understates what is owed. Land area only breaks an exact tie. Confirmed in testing: a ZIP resolved to the county holding just 40% of its land because that basket cost more. NO GENERATED ROW - covered by engine tests."},
   {"id":"E11","variation":"Someone living in one state and working in another",
    "expected":"A county is only accepted when the residence state agrees with it; otherwise the mismatch is flagged. Commuting across a state line is common near borders, and pricing someone against the wrong state''s cost of living and tax rules moves their whole floor."},
   {"id":"E12","variation":"A county with no cost-of-living data at all",
    "expected":"The result must be marked DEGRADED, so a number built on partial data is never presented as full confidence. CURRENTLY CANNOT BE TESTED: MIT now covers 3,144 counties, so the fixture no longer degrades, and the only counties without MIT data are in Puerto Rico, whose ZIPs do not resolve to a county at all. This guarantee is unverified end to end."}
  ]},
 {"group":"Engine A · Fair Pay (basket + tax gross-up)",
  "items":[
   {"id":"E13","variation":"A low-paid worker with a large family, where tax credits go negative",
    "expected":"The tax gross-up is floored at zero, so the Fair Pay floor can never fall BELOW the cost-of-living basket. Refundable credits such as EITC and CTC can make a family''s net tax negative; without the floor, government support would silently reduce what the employer is expected to pay."},
   {"id":"E14","variation":"All four coverage tiers - employee, +spouse, +children, family",
    "expected":"The tier drives both the household size used for the basket AND the tax filing status. A family tier means more people to feed and house, so a larger basket and a higher floor. Getting the tier wrong changes the number in both directions at once."},
   {"id":"E15","variation":"Coverage waived, so household size is unknown",
    "expected":"Falls back to the methodology''s default household and flags it. Someone who declines company insurance has not told you how many people they support, and the platform records that it assumed rather than knew."},
   {"id":"E16","variation":"Enrollment count contradicts the coverage tier",
    "expected":"Falls back to the number of children implied by the tier, and flags the contradiction. A family tier with one enrollee is a data-entry error, and the platform will not quietly pick whichever reading produces the cheaper answer."},
   {"id":"E17","variation":"States with local income tax on top of state tax",
    "expected":"Flagged as uncaptured, with the consequence stated: the Fair Pay floor may UNDERSTATE the tax this employee owes. The tax engine models federal and state tax but not every city or county levy, so the platform names the limitation instead of implying precision it does not have."}
  ]},
 {"group":"Engine B · Paid Sick Leave",
  "items":[
   {"id":"E18","variation":"A state that has banned local sick-leave laws",
    "expected":"The floor is zero and no cost is added. Texas, Florida, Georgia and Wisconsin preempt cities from mandating paid sick leave, so there is no statutory entitlement to bring the employer up to."},
   {"id":"E19","variation":"A state that requires accrual but caps nothing",
    "expected":"The floor is zero. Washington requires employees to accrue sick time but sets no annual ceiling on use, so there is no fixed number of hours to measure a shortfall against."},
   {"id":"E20","variation":"States with a firm annual cap - California 40h, New York 56h",
    "expected":"The shortfall between what the employer grants and what the law requires is costed at the employee''s FAIR-PAY hourly rate, not their current one. Generated rows cover California and New York; Arizona and Illinois follow the same path but have no fixture row."},
   {"id":"E21","variation":"A part-time employee working 1,040 hours a year",
    "expected":"Entitlement is halved, prorated against a 2,080-hour full-time year. Someone working half a year''s hours earns half the sick leave, so charging a full entitlement would overstate the cost."},
   {"id":"E22","variation":"A salaried exempt employee",
    "expected":"Excluded from sick-leave cost entirely. Their salary continues while they are off sick, so there is no incremental cost to make them whole - unlike an hourly worker who simply loses the pay."}
  ]},
 {"group":"Engine C · Affordable Healthcare",
  "items":[
   {"id":"E23","variation":"The employer pays only about half the premium",
    "expected":"Fails the employer-contribution benchmark and the plan is marked for REVIEW rather than pass or fail. A small employer is expected to cover at least 65% of a family premium; at 50% the employee is carrying too much of the cost."},
   {"id":"E24","variation":"The employer pays 90-100% of the premium",
    "expected":"The plan clears every screen and is marked affordable - the control case proving the benchmarks can pass, not only fail."},
   {"id":"E25","variation":"An employee chose a high-deductible plan",
    "expected":"A high-deductible plan is judged on real exposure, NOT on being high-deductible. It only counts against the employer when it is the ONLY plan offered. If a standard plan was also available, the employee exercised a preference - that is a choice, not a hardship imposed on them."},
   {"id":"E26","variation":"A grandfathered or non-ACA-compliant plan",
    "expected":"Should be flagged BEFORE the affordability benchmarks run. A grandfathered plan predates the Affordable Care Act and may be legally non-compliant however cheap it looks, so affordability is the wrong question to ask about it first. TESTING FOUND THIS IS NOT IMPLEMENTED - a plan named \"Grandfathered Legacy Plan\" returned affordable with no flag."},
   {"id":"E27","variation":"An eligible employee who declined coverage",
    "expected":"Not counted as a healthcare failure. Someone who turned down insurance - often because they are covered by a spouse - has not been failed by their employer, and treating a waiver as a failure would inflate the count of problem plans."}
  ]}
]'::jsonb),
    updated_at = now()
where key = 'dataset_catalog';
