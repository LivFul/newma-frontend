# NEWMA demo: sprint-review script (D-21)

A presenter's script for the sprint review: seven steps, about 15 minutes, five to seven personas.
It says what to click, what appears, and what to say. Everything described here is behaviour the
shipped app already has; nothing is promised beyond it. The automated twin of this script is
`tests/e2e/demo-script.spec.ts` (run it before the review, see "Pre-flight").

Ground rules for the presenter:

- Every `/demo/*` page carries the banner: "Demo with synthetic data. Not evidence of scientific
  performance, deployment or compliance (PRD front matter)." Read it out once at the start.
- Every record, name, score and amount is synthetic. Organisations and species say "fictional".
  Money is "demo credits", never a currency. Shares and splits are labelled "Illustrative".
- Use the labels exactly as the app shows them: "Simulated agent", "Simulated workflow engine",
  "Simulated compute", "Mock ELN", "Demo sign-in", "Demo signature, not production key" and
  "Optional, simulated". Do not call the agent AI, the signature a real signature, or the anchor a
  blockchain result.
- Computational outputs are hypotheses. Scientists approve experimental work and advancement.

| Step | Persona                            | Workflows | Minutes |
| ---- | ---------------------------------- | --------- | ------- |
| 1    | Visitor (no sign-in yet)           | Homepage  | 1       |
| 2    | Community liaison                  | W1, W10   | 2       |
| 3    | Scientist                          | W2, W3    | 4       |
| 4    | Scientific approver                | W4        | 2       |
| 5    | Wet-lab / CRO (with the Scientist) | W5        | 3       |
| 6    | Scientific approver                | W6        | 1       |
| 7    | Biopharma partner and Finance      | W8, W7    | 2       |
|      | Total                              |           | 15      |

## Pre-flight checklist

Do this 15 minutes before, on the URL you will present from, in a desktop browser.

- [ ] The homepage loads and the hero diagram is visible. Cookies are allowed for the site.
- [ ] Open `/access`, choose "Community liaison" (Demo sign-in, no password). The banner shows on
      `/demo`. If you land back on `/access`, the demo API is not reachable: stop and see "What to
      say if something fails".
- [ ] Open `/demo/tour` (the header has the same button). Choose "Reset demo data" and confirm, so every record starts as seeded
      (the seeded settlement, valid and expired consent, the H0 candidates).
- [ ] On `/demo/tour` the Demo speed line reads "Demo speed: 4×" followed by "(server default)".
      Leave it at the server default: the timings below assume it. Do not pick a faster speed for
      the review.
- [ ] On `/demo/w7-settlement` the switch "Simulate chain outage (demo)" is off.
- [ ] The persona select in the header (label "Persona") shows all eight personas.
- [ ] Window at least 1280 px wide, default zoom, notifications off, one tab only.
- [ ] Optional rehearsal: `DEMO_E2E=1 PLAYWRIGHT_BASE_URL=<url> pnpm playwright test tests/e2e/demo-script.spec.ts --project=desktop-chromium`.
      It walks these seven steps at demo speed 8, sets the speed back to the server default, and
      leaves the demo in a used state: reset again afterwards and recheck the Demo speed line.
- [ ] Keep the guided tour (`/demo/tour`) closed; this script replaces it for the review.

Between steps you may switch persona with the header select. After a step that changes data
(withdrawal, signed gate, imported results) do not go back to the first screens expecting seeded
values.

## Step 1. Homepage (1 minute)

Persona: none. Path: `/`.

1. Scroll down the homepage past the hero to the "How it works" and "About LivFul" sections, then
   back to the top. Say: the page describes a proposed platform and states design goals, not
   results.
2. Hover the hero diagram. Expected: the layers separate ("exploded" view). Move the pointer away.
   Expected: they reassemble.
3. Press Tab until a hero component has focus, then press the Down arrow three times to reach
   "Wet Lab", then Enter. Expected: `/ecosystem/wet-lab`, heading "Wet Lab", with its sources.
4. Follow "See it in the demo". Expected: `/access`, titled "Demo sign-in", listing personas.
5. Choose "Community liaison". Expected: `/demo` with the banner.

Say: "This is the public site. The demo behind it is a clickable prototype on synthetic data."

## Step 2. Community liaison: W1 rights and W10 custodian view (2 minutes)

Persona: Community liaison. Paths: `/demo/w1-rights`, `/demo/w10-custodian`.

1. W1, "Evaluate policy". Under "Asset" pick a record ending "(valid)", Purpose "research",
   Action "retrieve", then "Evaluate policy". Expected: the decision reads "allow", the "Policy
   decision" card shows the reason code `rights_valid_for_purpose`, and "Retrieval cache entries"
   lists an "Active" entry.
2. Repeat with a record ending "(expired)", same purpose and action. Expected: "hold", with
   "Remediation:" text. Say: a hold is not a denial; the card says how to fix it.
3. Withdraw consent. In the registry table, on a valid row, choose "Withdraw consent", give a
   reason, "Confirm withdrawal". Choose a valid record that is not the subject listed under
   "Governing records" for the top-ranked partner pack in step 7, or step 7's export will be
   refused. Expected: the row moves to the withdrawn rows and the "Retrieval cache entries" show
   "Invalidated: <reason>". Evaluating the withdrawn record now gives "deny" with
   `consent_withdrawn`.
4. W10, `/demo/w10-custodian`. Say: this is the plain-language view for a community. Show an
   agreement's obligation rows, each marked Done, Due or Late. Open "Raise a concern about this
   agreement" on an agreement still in force, type what happened in "Tell us what happened", then
   "Send concern". Expected: a status line "Your concern was sent".

Optional, if time allows: as Data steward the concern appears under "Grievance queue" on W1 with
"Acknowledge" (the tour covers this).

## Step 3. Scientist: W2 evidence labels and W3 agent query (4 minutes)

Persona: Scientist (header select "Persona"). Paths: `/demo/w2-evidence`, `/demo/w3-agent`.

1. W2. Show the "Evidence label legend": "Literature-reported", "Tentative annotation",
   "Computational prediction", "Measured observation", "Scientist-accepted", "Unresolved /
   conflicting". Open the Observations tab: the rows carry these labels. Say: the six
   kinds of evidence are never merged.
2. W3. Leave the objective, target and budget as they are and choose "Ask the simulated agent".
   Expected: a page for the query whose "Agent status" moves through the steps under the
   "Simulated agent" label, with jobs under "Simulated workflow engine" and "Simulated compute".
   It runs live and takes about a minute and a half at the default speed; narrate while it
   progresses.
3. Expected on completion: status completed; one step shows "Retried after simulated failure";
   "Ranked hypotheses" lists items badged "Synthetic"; "Included evidence" and "Withheld by policy"
   show what the rights decisions allowed; a link "Submit as work package in W5" appears.
   Say: agents recommend, scientists decide.
4. Return to W3, set "Budget (demo credits)" to 10 and ask again. Expected: status held and a
   "Budget hold" card reading "Held: the budget check did not pass." with a remediation that
   names `budget_credits`. No job runs.
5. Go back to the completed query and keep its "Submit as work package in W5" link for step 5.

## Step 4. Scientific approver: W4 gates (2 minutes)

Persona: Scientific approver. Path: `/demo/w4-gates`.

1. Open the rank 2 candidate. Its tracker shows H0 reached. Choose "Sign H1 decision".
2. In the dialog give a rationale, type the candidate's id into the "Demo sign-in step-up" field,
   then "Sign decision". Expected: the H1 stage becomes PASS and a signed card appears reading
   "Demo signature, not production key". Say: the key is a demo key; the card links to the signed
   provenance for this gate (used in step 6).
3. Open the rank 1 candidate and choose "Sign H2 decision". Give a rationale and the candidate id.
   Expected: the dialog shows an alert with `gate_requirements_missing` and three missing
   requirements (replicates). Close it. Say: independent conditions are checked on the server;
   the approver's click alone does not move a candidate forward.

## Step 5. Wet-lab / CRO: W5 closed loop (3 minutes)

Personas: Scientist, then Wet-lab / CRO, then back as required. Path: `/demo/w5-wet-lab`.

1. As Scientist follow "Submit as work package in W5" from step 3 (it prefills the form). Set
   "Scenario" to "Missing sample (reconciliation hold)" and choose "Submit work package".
   Expected: the work package page shows "Mock ELN" and "Simulated workflow engine"; the status
   moves until results are available; narrate while it runs.
2. Switch to Wet-lab / CRO. Choose "Import results". Expected: an observation count, a checksum,
   and the reconciliation status "HOLD" because one sample is missing.
3. Switch to Scientist. On the row that is not "matched" choose "Record disposition", write a
   rationale (for example that the sample was not shipped), and confirm. Expected: reconciliation
   becomes "reconciled".
4. Choose "Accept results", give a rationale, "Confirm acceptance". Expected: "Accepted by NEWMA
   scientist" (not just "Recorded in Mock ELN"). Under the retraining proposal: "Blocked pending
   separate authorization". Say: a recorded result is not an accepted result, and retraining
   needs its own authorization.
5. Switch to Wet-lab / CRO and choose "Edit Mock ELN record (correct a value)". Expected: "New
   revision 2 — re-review required"; importing again shows that re-review is required. Choose
   "Execute retraining" on the proposal. Expected: an alert with `retraining_not_authorized`.

## Step 6. W6 provenance: verify, then tamper (1 minute)

Persona: Scientific approver. Path: `/demo/w6-provenance/gate/<gate id>`, reached from the signed
card in step 4 ("View signed provenance for this gate") or from "Decided gates" on
`/demo/w6-provenance`.

1. The timeline shows the signed `gate.decided` event. Choose "Verify signature". Expected:
   "Valid".
2. Turn on the switch "Demo tamper toggle" (it changes a copy of the manifest, not the record) and
   choose "Verify signature" again. Expected: the result reads "Invalid" and the status names
   `signature_mismatch`. Say: any change to the signed content is detected; the signature is a
   demo signature, not a production key.

## Step 7. Partner and Finance: W8 export, W7 settlement (2 minutes)

Personas: Biopharma partner, then Tenant admin and Finance. Paths: `/demo/w8-partner`,
`/demo/w7-settlement`.

1. Partner, W8. Open the rank 1 pack. Fields the rights decision restricts show as "withheld" with
   a reason code, for example "Collection location" with `restricted_field`. Choose "Issue
   export". Expected: an "Export issued" card with status "Active" and "Demo signature, not
   production key"; the withheld field stays withheld.
2. Partner, W7. On `/demo/w7-settlement` request a license (credential "Optional, simulated",
   a short scope), choose "Run credential check". Expected: "Verified" and "No attributes
   disclosed". Switch to Tenant admin, "Decide license", approve. Expected: state approved and a
   planned benefit item.
3. Switch to Finance. "Create settlement", record a receipt ("Reference", "Amount (demo credits)"),
   "Mark reviewed", "Approve evidence", "Reconcile receipts". Expected: four calculation lines each
   marked "Illustrative", "Conserved: <amount> demo credits", and "Frozen at reconciliation".
4. Open the seeded settlement `DEMO-S-001` from the settlement list. Expected: state "disputed";
   one receipt "held — not payable", one duplicate "rejected, not counted", and "No payout: nothing
   has been posted"; reconcile and distribute are not offered. Say: a disputed receipt blocks the
   payout until it is resolved. (Finance can "Resolve a disputed receipt" by reinstating it; not
   part of the timed script.)
5. Back on the W7 overview, turn on "Simulate chain outage (demo)". Expected: "Chain outage
   simulated — new anchors stay pending". Say: anchoring is "Optional, simulated"; signing and the
   audit trail do not depend on it. Switch to Scientist, open `/demo/jobs`, choose "Start
   simulated screening": the job reaches a final state while the outage is on. Turn the outage
   off (as Finance); a pending anchor then shows "Anchored".

If you are short of time, do 1, 3 and 5 and skip the rest.

## What to say if something fails

Keep calm and keep the framing: this is a demo with synthetic data and simulated parts.

| Symptom                                               | What to do and say                                                                                                                                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/access` after sign-in, or an error notice on a page | "The demo API is not answering; the site and the demo are separate services." Reload once, wait ten seconds, try again. If it persists, show the homepage and the six component pages instead.      |
| A simulated job seems stuck or fails                  | "The Simulated workflow engine retries failed work; a retry or a failure is part of the demo." Wait for the retry. If it passes three minutes, say so, move on and return to it at the end.         |
| A step's expected result differs                      | Say what the screen shows, not what the script says. Check whether the data was already used (an earlier rehearsal or a withdrawal on the wrong record) and choose "Reset demo data" between steps. |
| Step 7's export is refused with `consent_withdrawn`   | The withdrawn record governs that pack. Say: "That is the point of W1: a withdrawal stops the export." Move on; reset after the review.                                                             |
| A dialog or button is missing                         | The persona may not be allowed to act: a notice names the allowed persona. Switch persona with the header select.                                                                                   |
| The session expired                                   | Sessions are short-lived. Sign in again at `/access`; "Reset demo data" returns to the seeded state.                                                                                                |

Never explain a failure with claims about performance, deployment or compliance. The banner already
says the demo is not evidence of any of them.
