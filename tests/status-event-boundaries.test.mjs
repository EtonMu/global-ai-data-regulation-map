import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const events = JSON.parse(
  await readFile(
    new URL("../data/v2/status-events.json", import.meta.url),
    "utf8",
  ),
);
const byId = new Map(events.map((event) => [event.id, event]));

test("current legal-status events do not preserve superseded future or cessation claims", () => {
  const korea = byId.get("evt-kr-ai-framework-act-final-amendment-phase");
  assert.equal(korea.date, "2026-07-21");
  assert.equal(korea.type, "amendment-effective");
  assert.equal(korea.resultingStatus, "in-force-amended");
  assert.match(korea.effect, /Articles 17-2 and 22-3/);

  const australia = byId.get(
    "evt-au-mandatory-ai-guardrails-not-proceeding",
  );
  assert.equal(australia.type, "consultation-outcome-announced");
  assert.match(australia.effect, /not the legal cessation or repeal/i);

  const saudi = byId.get(
    "evt-sa-pdpl-transfer-regulation-v2-effective",
  );
  assert.equal(saudi.date, "2024-09-01");
  assert.equal(saudi.type, "regulation-published-and-effective");
  assert.equal(saudi.resultingStatus, "in-force");
  assert.match(saudi.source.url, /portal\.uqn\.gov\.sa/);
});

test("POPIA events separate commencement, grace period, and later application", () => {
  const commencement = byId.get(
    "evt-za-popia-principal-provisions-commenced",
  );
  assert.equal(commencement.date, "2020-07-01");
  assert.match(commencement.effect, /section 58\(2\)/i);

  const grace = byId.get("evt-za-popia-general-compliance");
  assert.equal(grace.date, "2021-07-01");
  assert.match(grace.effect, /grace period/i);
  assert.match(grace.effect, /already commenced on 1 July 2020/i);

  const application = byId.get(
    "evt-za-popia-prior-authorization-applicability",
  );
  assert.equal(application.date, "2022-02-01");
  assert.match(application.effect, /Notice 560/);
  assert.match(application.effect, /applied/i);
});

test("Taiwan PDPA event preserves the latest-promulgated English boundary", () => {
  const taiwan = byId.get("evt-tw-pdpa-current-with-pending-amendments");
  assert.equal(taiwan.resultingStatus, "in-force-with-uncommenced-amendments");
  assert.match(taiwan.effect, /26 affected nodes/);
  assert.match(taiwan.effect, /latest-promulgated rather than current-effective/i);
});

test("EU AI Act events follow Regulation 2026/1744 and amended Article 113", () => {
  const amendment = byId.get("evt-eu-ai-act-reg-2026-1744-effective");
  assert.equal(amendment.date, "2026-07-27");
  assert.equal(amendment.resultingStatus, "partially-applicable-amended");
  assert.match(amendment.source.url, /reg\/2026\/1744/);

  assert.equal(
    byId.get("evt-eu-ai-act-art5-new-prohibitions-apply").date,
    "2026-12-02",
  );
  assert.equal(
    byId.get("evt-eu-ai-act-annex-iii-high-risk-apply").date,
    "2027-12-02",
  );
  assert.equal(byId.get("evt-ai-act-art6-1-later").date, "2028-08-02");
  assert.doesNotMatch(
    byId.get("evt-eu-ai-act-digital-omnibus-final-adoption").effect,
    /this snapshot waits/i,
  );
});
