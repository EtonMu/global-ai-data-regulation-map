import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const corpusPath = resolve(root, "data/v2/eu-ai-act-articles.json");
const snapshotDate = "2026-07-28";
const article113Source =
  "https://eur-lex.europa.eu/eli/reg/2024/1689/art_113/oj/eng";

const records = JSON.parse(await readFile(corpusPath, "utf8"));

function stage(appliesFrom, scope) {
  return { appliesFrom, scope, source: article113Source };
}

function scheduleFor(article) {
  const number = article.articleNumber;
  const chapter = article.chapter?.id;
  const section = article.section?.id;

  if (number === "113") {
    return [
      stage(
        "2024-08-01",
        "Entry-into-force and application provision itself",
      ),
    ];
  }
  if (number === "4a") {
    return [
      stage(
        "2026-07-27",
        "Article inserted by Regulation (EU) 2026/1744 when that amending act entered into force",
      ),
    ];
  }
  if (chapter === "cpt_I") {
    return [stage("2025-02-02", "Chapter I")];
  }
  if (number === "5") {
    return [
      stage(
        "2025-02-02",
        "Article 5 other than paragraph 1, first subparagraph, points (ba) and (bb), and paragraphs 1a and 1b",
      ),
      stage(
        "2026-12-02",
        "Article 5(1), first subparagraph, points (ba) and (bb), and Article 5(1a) and (1b)",
      ),
    ];
  }
  if (["cpt_III.sct_1", "cpt_III.sct_2", "cpt_III.sct_3"].includes(section)) {
    if (number === "6") {
      return [
        stage("2026-08-02", "Article 6(5)"),
        stage(
          "2027-12-02",
          "Article 6 and Chapter III Sections 1–3 as regards Article 6(2)/Annex III high-risk systems, excluding Article 6(5)",
        ),
        stage(
          "2028-08-02",
          "Article 6 and Chapter III Sections 1–3 as regards Article 6(1)/Annex I high-risk systems, excluding Article 6(5)",
        ),
      ];
    }
    return [
      stage(
        "2027-12-02",
        "Chapter III Sections 1–3 as regards Article 6(2)/Annex III high-risk systems",
      ),
      stage(
        "2028-08-02",
        "Chapter III Sections 1–3 as regards Article 6(1)/Annex I high-risk systems",
      ),
    ];
  }
  if (section === "cpt_III.sct_4") {
    return [stage("2025-08-02", "Chapter III Section 4")];
  }
  if (chapter === "cpt_V" || chapter === "cpt_VII" || ["99", "100"].includes(number)) {
    return [
      stage(
        "2025-08-02",
        chapter === "cpt_XII" ? "Chapter XII, except Article 101" : article.chapter.title,
      ),
    ];
  }
  if (number === "78") {
    return [stage("2025-08-02", "Article 78")];
  }
  if (Number(number) >= 102 && Number(number) <= 110) {
    return [stage("2026-07-27", "Articles 102–110")];
  }
  if (number === "111") {
    return [
      stage(
        "2026-07-27",
        "Delegated powers newly conferred by Regulation (EU) 2026/1744 in Article 111(2)",
      ),
      stage(
        "2026-08-02",
        "Remaining Article 111 provisions under the general application rule",
      ),
    ];
  }
  return [stage("2026-08-02", "General application rule")];
}

const annotated = records.map((article) => {
  const applicationSchedule = scheduleFor(article);
  const applicableStages = applicationSchedule.filter(
    (item) => item.appliesFrom <= snapshotDate,
  );
  const futureStages = applicationSchedule.filter(
    (item) => item.appliesFrom > snapshotDate,
  );
  const currentLawStatus = applicableStages.length
    ? futureStages.length
      ? "partially-applicable"
      : "current-applicable"
    : "in-force-not-yet-applicable";
  return {
    ...article,
    legalEffectStatus: currentLawStatus,
    appliesFrom: applicationSchedule[0].appliesFrom,
    applicability: {
      displayedVersion: "source-derived-current-consolidation-as-of-2026-07-27",
      appliesFrom: applicationSchedule[0].appliesFrom,
      currentLawStatus,
      applicationStatusAsOf: snapshotDate,
      applicationSchedule,
      basis: "Regulation (EU) 2024/1689, Article 113, as amended by Regulation (EU) 2026/1744",
      historyNote:
        "The Regulation is in force. Application dates are provision- and, for Chapter III Sections 1–3, system-category-specific; this metadata must not be read as a single commencement date for every paragraph or use case.",
    },
  };
});

await writeFile(corpusPath, `${JSON.stringify(annotated, null, 2)}\n`);
console.log(
  `Annotated ${annotated.length} EU AI Act Articles with Article 113 application layers as of ${snapshotDate}.`,
);
