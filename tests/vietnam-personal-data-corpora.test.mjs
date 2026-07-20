import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
const compactSha256 = (paragraphs) =>
  sha256(paragraphs.join("\n").normalize("NFC").replace(/\s+/gu, ""));

const [law, decree356, decree13, handoff, lawGazette, decree356Gazette, decree13Gazette, decree13Official, decree13Crosscheck, decree13EnglishManifest, decree13EnglishCatalogue, currentEnglishManifest, lawEnglishCatalogue, decree356EnglishCatalogue] =
  await Promise.all([
    loadJson("vn-personal-data-protection-law-2025-articles.json"),
    loadJson("vn-decree-356-2025-provisions.json"),
    loadJson("vn-decree-13-2023-historical-provisions.json"),
    loadJson("legal-corpus-handoff-vietnam.json"),
    loadJson("source-snapshots/vn-pdpl-2025-official-gazette-articles.json"),
    loadJson("source-snapshots/vn-decree-356-2025-official-gazette-provisions.json"),
    loadJson("source-snapshots/vn-decree-13-2023-official-gazette-provisions.json"),
    loadJson("source-snapshots/vn-decree-13-2023-official-html-articles.json"),
    loadJson("source-snapshots/vn-decree-13-2023-clean-crosscheck.json"),
    loadJson("vn-decree-13-2023-project-english-manifest.json"),
    loadJson("source-snapshots/vn-decree-13-2023-project-en-draft-2026-07-20.json"),
    loadJson("vn-current-personal-data-regime-project-english-manifest.json"),
    loadJson("source-snapshots/vn-pdpl-2025-project-en-draft-2026-07-20.json"),
    loadJson("source-snapshots/vn-decree-356-2025-project-en-draft-2026-07-20.json"),
  ]);

function assertCommonIntegrity(unit, instrumentId, status) {
  assert.equal(unit.instrumentId, instrumentId);
  assert.equal(unit.language, "vi-VN");
  assert.equal(unit.fullText, unit.paragraphs.join("\n\n"));
  assert.equal(unit.fullText, unit.fullText.normalize("NFC"));
  assert.equal(unit.contentSha256, sha256(unit.fullText));
  assert.doesNotMatch(unit.fullText, /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u);
  assert.ok(unit.fullText.length > 20);
  assert.equal(unit.retrievedOn, "2026-07-20");
  assert.equal(unit.versionAsOf, "2026-07-20");
  assert.equal(unit.statusAsOf, "2026-07-20");
  assert.equal(unit.legalEffectStatus, status);
  assert.equal(unit.sourceVersion.statusAsOf, "2026-07-20");
  assert.match(unit.source, /^https:\/\//u);
  assert.match(unit.canonicalSource, /^https:\/\//u);
  assert.match(unit.statusSource, /^https:\/\//u);
  assert.ok(Number.isInteger(unit.sourcePageRange.start));
  assert.ok(Number.isInteger(unit.sourcePageRange.end));
  assert.ok(unit.sourcePageRange.start > 0);
  assert.ok(unit.sourcePageRange.end >= unit.sourcePageRange.start);
  assert.match(unit.sourcePageRangeDocument, /^https:\/\//u);
  assert.ok(Number.isInteger(unit.officialGazetteSourceLineRange.start));
  assert.ok(Number.isInteger(unit.officialGazetteSourceLineRange.end));
  assert.ok(unit.officialGazetteSourceLineRange.start > 0);
  assert.ok(
    unit.officialGazetteSourceLineRange.end >= unit.officialGazetteSourceLineRange.start,
  );
  if (
    instrumentId === "vn-personal-data-protection-law-2025" ||
    instrumentId === "vn-decree-356-2025"
  ) {
    assert.equal(
      unit.englishAvailability.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(
      unit.englishAvailability.coverageStatus,
      "complete-current-project-reference",
    );
    assert.equal(unit.englishAvailability.currentTextEquivalent, true);
    assert.equal(
      unit.englishAvailability.alignmentStatus,
      "aligned-to-pinned-current-official-vietnamese",
    );
    assert.equal(unit.englishAvailability.legalEffectStatus, "in-force");
    assert.match(unit.englishAvailability.note, /Every stored Vietnamese paragraph/u);
    const english = unit.translations.en;
    assert.equal(
      english.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(english.coverageStatus, "complete-current-project-reference");
    assert.equal(english.versionAsOf, "2026-07-20");
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(
      english.alignmentStatus,
      "aligned-to-pinned-current-official-vietnamese",
    );
    assert.equal(english.legalEffectStatus, "in-force");
    assert.equal(english.paragraphs.length, unit.paragraphs.length);
    assert.equal(english.fullText, english.paragraphs.join("\n\n"));
    assert.equal(english.contentSha256, sha256(english.fullText));
    assert.equal(english.translationBasis.sourceContentSha256, unit.contentSha256);
    assert.equal(english.translationBasis.sourceParagraphCount, unit.paragraphs.length);
    assert.match(english.translationBasis.method, /machine-assisted/u);
    assert.equal(english.rights.reuseStatus, "cc-by-4.0-project-authored-translation");
    assert.equal(
      english.rights.licenseUrl,
      "https://creativecommons.org/licenses/by/4.0/",
    );
    assert.match(english.note, /nonofficial/u);
    assert.match(english.note, /no legal effect/u);
    assert.doesNotMatch(
      english.fullText,
      /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u,
    );
    assert.doesNotMatch(
      english.fullText,
      /Fish data|Personal Personal|31\s*\/\s*12|cents individual|muscles law enforcement|mobile characteristics transmit|credit credit assessment|maximum of 01 extension|must ensure to clearly state|\bour systems\b|procedures of the Personal Data Subject/iu,
    );
    assert.doesNotMatch(english.fullText, /except In cases/u);
  } else if (instrumentId === "vn-decree-13-2023") {
    assert.equal(
      unit.englishAvailability.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(
      unit.englishAvailability.coverageStatus,
      "complete-historical-project-reference",
    );
    assert.equal(unit.englishAvailability.legalEffectStatus, "repealed");
    assert.match(unit.englishAvailability.note, /44 Articles and six Appendix forms/u);
    const english = unit.translations.en;
    assert.equal(
      english.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(english.coverageStatus, "complete-historical-project-reference");
    assert.equal(english.versionAsOf, "2026-07-20");
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(english.legalEffectStatus, "repealed");
    assert.equal(english.paragraphs.length, unit.paragraphs.length);
    assert.equal(english.fullText, english.paragraphs.join("\n\n"));
    assert.equal(english.contentSha256, sha256(english.fullText));
    assert.equal(english.translationBasis.sourceContentSha256, unit.contentSha256);
    assert.equal(english.translationBasis.sourceParagraphCount, unit.paragraphs.length);
    assert.match(english.translationBasis.method, /machine-assisted/u);
    assert.equal(english.rights.reuseStatus, "cc-by-4.0-project-authored-translation");
    assert.equal(
      english.rights.licenseUrl,
      "https://creativecommons.org/licenses/by/4.0/",
    );
    assert.match(english.note, /repealed in full from 1 January 2026/u);
    assert.doesNotMatch(
      english.fullText,
      /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/u,
    );
    const duplicated = english.fullText.match(/\b([A-Za-z]{3,})\b(?:\s+|,\s+)\1\b/iu);
    assert.ok(
      !duplicated || ["article", "information"].includes(duplicated[1].toLowerCase()),
      `${unit.id} duplicated word: ${duplicated?.[0]}`,
    );
  }
  assert.equal(unit.rights.reuseStatus, "government-edict");
  assert.match(unit.rights.license, /Article 15\(2\)/u);
  assert.equal(
    unit.rights.licenseUrl,
    "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/155-vbhn-vpqh.pdf",
  );
}

function article(units, number) {
  const result = units.find((unit) => unit.articleNumber === String(number));
  assert.ok(result, `missing Article ${number}`);
  return result;
}

test("Law No. 91/2025/QH15 contains the complete current Articles 1-39", () => {
  assert.equal(law.length, 39);
  assert.deepEqual(
    law.map((unit) => unit.articleNumber),
    Array.from({ length: 39 }, (_, index) => String(index + 1)),
  );
  for (const [index, unit] of law.entries()) {
    const number = index + 1;
    assertCommonIntegrity(unit, "vn-personal-data-protection-law-2025", "in-force");
    assert.equal(unit.id, `vn-pdpl-2025-art-${number}`);
    assert.equal(unit.unitType, "article");
    assert.equal(unit.label, `Điều ${number}`);
    assert.ok(unit.fullText.startsWith(`Điều ${number}.`));
    assert.equal(unit.effectiveFrom, "2026-01-01");
    assert.equal(unit.sourceVersion.instrumentNumber, "91/2025/QH15");
    assert.equal(unit.sourceVersion.status, "Còn hiệu lực");
    assert.equal(
      unit.officialGazetteSource,
      "https://congbaocdn.chinhphu.vn/CongBaoCP/CongBao/2025/7/45574/57723-1-971-972.pdf",
    );
  }

  const anchors = new Map([
    [4, "Quyền và nghĩa vụ của chủ thể dữ liệu cá nhân"],
    [9, "Sự đồng ý của chủ thể dữ liệu cá nhân"],
    [19, "trường hợp không cần sự đồng ý"],
    [20, "Chuyển dữ liệu cá nhân xuyên biên giới"],
    [21, "Đánh giá tác động xử lý dữ liệu cá nhân"],
    [23, "Thông báo vi phạm quy định về bảo vệ dữ liệu cá nhân"],
    [30, "xử lý dữ liệu lớn, trí tuệ nhân tạo, chuỗi khối, vũ trụ ảo, điện toán đám mây"],
    [38, "có hiệu lực thi hành từ ngày 01 tháng 01 năm 2026"],
    [39, "Quy định chuyển tiếp"],
  ]);
  for (const [number, phrase] of anchors) {
    assert.ok(article(law, number).fullText.includes(phrase), `Law Article ${number} anchor`);
  }
});

test("Law Articles exactly match the pinned official Gazette hashes", () => {
  assert.equal(lawGazette.instrumentId, "vn-personal-data-protection-law-2025");
  assert.equal(lawGazette.sourceRole, "official-gazette-searchable-text-verification");
  assert.equal(
    lawGazette.sourceDocumentSha256,
    "abf363a09236d032df97e7b629ee2c0368cf2c8972262f2eb10eac5b587b2d2e",
  );
  assert.equal(lawGazette.articles.length, 39);
  for (const [index, snapshotArticle] of lawGazette.articles.entries()) {
    assert.equal(snapshotArticle.articleNumber, String(index + 1));
    assert.equal(compactSha256(law[index].paragraphs), snapshotArticle.compactTextSha256);
  }
});

test("Decree No. 356/2025 contains all 42 Articles and all 13 official Gazette forms", () => {
  assert.equal(decree356.length, 55);
  const articles = decree356.slice(0, 42);
  const forms = decree356.slice(42);
  assert.deepEqual(
    articles.map((unit) => unit.articleNumber),
    Array.from({ length: 42 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(
    forms.map((unit) => unit.formNumber),
    ["01a", "01b", "02a", "02b", "03a", "03b", "04", "05", "06", "07", "08", "09", "10"],
  );

  for (const [index, unit] of articles.entries()) {
    const number = index + 1;
    assertCommonIntegrity(unit, "vn-decree-356-2025", "in-force");
    assert.equal(unit.id, `vn-decree-356-2025-art-${number}`);
    assert.equal(unit.unitType, "article");
    assert.ok(unit.fullText.startsWith(`Điều ${number}.`));
    assert.equal(unit.effectiveFrom, "2026-01-01");
    assert.equal(unit.sourceVersion.instrumentNumber, "356/2025/NĐ-CP");
    assert.equal(unit.sourceVersion.status, "Còn hiệu lực");
  }
  for (const unit of forms) {
    assertCommonIntegrity(unit, "vn-decree-356-2025", "in-force");
    assert.equal(unit.id, `vn-decree-356-2025-form-${unit.formNumber}`);
    assert.equal(unit.unitType, "appendix-form");
    assert.equal(unit.articleNumber, `Form ${unit.formNumber}`);
    assert.equal(unit.chapter.label, "Phụ lục");
    assert.match(unit.fullText, /^Mẫu(?: số)?\s+/u);
  }
  assert.equal(forms.find((unit) => unit.formNumber === "09").paragraphs[0], "Mẫu 09");

  const anchors = new Map([
    [4, "Danh mục dữ liệu cá nhân nhạy cảm"],
    [10, "hệ thống trí tuệ nhân tạo, vũ trụ ảo"],
    [17, "Chuyển dữ liệu cá nhân xuyên biên giới"],
    [18, "hồ sơ đánh giá tác động chuyển dữ liệu cá nhân xuyên biên giới"],
    [19, "hồ sơ đánh giá tác động xử lý dữ liệu cá nhân"],
    [29, "dữ liệu vị trí cá nhân và dữ liệu sinh trắc học"],
    [41, "doanh nghiệp nhỏ, doanh nghiệp khởi nghiệp"],
    [42, "Nghị định số 13/2023/NĐ-CP"],
  ]);
  for (const [number, phrase] of anchors) {
    assert.ok(article(articles, number).fullText.includes(phrase), `Decree 356 Article ${number} anchor`);
  }
  assert.equal(article(articles, 42).legalEffect.effect, "repeals-in-full");
  assert.equal(article(articles, 42).legalEffect.effectiveFrom, "2026-01-01");
});

test("Decree 356 preserves official Gazette wording where secondary text differed", () => {
  assert.match(article(decree356, 6).fullText, /định dạng kiếm chứng được/u);
  assert.doesNotMatch(article(decree356, 6).fullText, /định dạng kiểm chứng được/u);
  assert.match(article(decree356, 12).fullText, /mã hoá ở trạng thái nghỉ/u);
  assert.match(article(decree356, 17).fullText, /Bên Xử lý dữ liệu cá nhân và Bên thứ ba/u);
  assert.match(article(decree356, 18).fullText, /hoàn thiện Hồ sơ đánh giá tác động chuyển/u);
  assert.match(article(decree356, 19).fullText, /lập và lưu giữ Hồ sơ đánh giá tác động xử lý/u);
  assert.match(article(decree356, 34).fullText, /vận hành Cổng thông tin quốc gia/u);
  assert.match(article(decree356, 42).fullText, /đánh giá tác động chuyển, xử lý dữ liệu xuyên biên giới/u);
  assert.doesNotMatch(article(decree356, 42).fullText, /đánh giá tác động chuyên, xử lý/u);
});

test("Decree 356 corpus text and all forms are tied to official Gazette hashes", () => {
  assert.equal(decree356Gazette.instrumentId, "vn-decree-356-2025");
  assert.equal(decree356Gazette.sourceRole, "official-gazette-searchable-text-verification");
  assert.equal(
    decree356Gazette.sourceDocumentSha256,
    "f24747bf3c374b04901e66704423ea1e1a60460376c4d052d649ecc8a2a2f1eb",
  );
  assert.equal(decree356Gazette.articles.length, 42);
  assert.equal(decree356Gazette.forms.length, 13);
  const snapshotUnits = [...decree356Gazette.articles, ...decree356Gazette.forms];
  for (const [index, snapshotUnit] of snapshotUnits.entries()) {
    assert.deepEqual(decree356[index].paragraphs, snapshotUnit.paragraphs);
    assert.equal(compactSha256(decree356[index].paragraphs), snapshotUnit.compactTextSha256);
  }
  const correctionCount = decree356Gazette.articles.reduce(
    (count, unit) => count + unit.secondaryTranscriptionCorrections.length,
    0,
  );
  assert.equal(correctionCount, 13);
});

test("Historical Decree No. 13/2023 is complete and every node is marked repealed", () => {
  assert.equal(decree13.length, 50);
  const articles = decree13.slice(0, 44);
  const forms = decree13.slice(44);
  assert.deepEqual(
    articles.map((unit) => unit.articleNumber),
    Array.from({ length: 44 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(forms.map((unit) => unit.formNumber), ["01", "02", "03", "04", "05", "06"]);

  for (const unit of decree13) {
    assertCommonIntegrity(unit, "vn-decree-13-2023", "repealed");
    assert.equal(unit.effectiveFrom, "2023-07-01");
    assert.equal(unit.repealedFrom, "2026-01-01");
    assert.deepEqual(unit.historicalEffectivePeriod, {
      from: "2023-07-01",
      through: "2025-12-31",
    });
    assert.equal(unit.controllingRepeal.instrument, "Nghị định số 356/2025/NĐ-CP");
    assert.equal(unit.controllingRepeal.provision, "Điều 42 khoản 2");
    assert.match(unit.statusDiscrepancy, /later, controlling Article 42\(2\)/u);
    assert.equal(unit.sourceVersion.status, "Hết hiệu lực toàn bộ");
  }
  for (const [index, unit] of articles.entries()) {
    assert.equal(unit.id, `vn-decree-13-2023-art-${index + 1}`);
    assert.equal(unit.unitType, "article");
  }
  for (const unit of forms) {
    assert.equal(unit.id, `vn-decree-13-2023-form-${unit.formNumber}`);
    assert.equal(unit.unitType, "appendix-form");
  }

  const anchors = new Map([
    [9, "Quyền của chủ thể dữ liệu"],
    [11, "Sự đồng ý của chủ thể dữ liệu"],
    [17, "trường hợp không cần sự đồng ý"],
    [23, "chậm nhất 72 giờ sau khi xảy ra hành vi vi phạm"],
    [24, "Đánh giá tác động xử lý dữ liệu cá nhân"],
    [25, "Chuyển dữ liệu cá nhân ra nước ngoài"],
    [43, "có hiệu lực thi hành từ ngày 01 tháng 7 năm 2023"],
    [44, "Trách nhiệm thi hành"],
  ]);
  for (const [number, phrase] of anchors) {
    assert.ok(article(articles, number).fullText.includes(phrase), `Decree 13 Article ${number} anchor`);
  }
});

test("Historical Decree 13 Articles and forms retain their official-source handoff text", () => {
  assert.equal(decree13Gazette.instrumentId, "vn-decree-13-2023");
  assert.equal(decree13Gazette.sourceRole, "official-gazette-searchable-text-verification");
  assert.equal(
    decree13Gazette.sourceDocumentSha256,
    "5b026143b56779199603a164260cc76533a816b9c851a4c769e16a55ef7d6e6f",
  );
  assert.equal(decree13Gazette.articles.length, 44);
  assert.equal(decree13Gazette.forms.length, 6);
  assert.equal(decree13Official.articles.length, 44);
  assert.equal(decree13Crosscheck.forms.length, 6);
  const snapshotUnits = [...decree13Gazette.articles, ...decree13Gazette.forms];
  for (const [index, snapshotUnit] of snapshotUnits.entries()) {
    assert.deepEqual(decree13[index].paragraphs, snapshotUnit.paragraphs);
    assert.equal(compactSha256(decree13[index].paragraphs), snapshotUnit.compactTextSha256);
  }
  const correctionOccurrences = decree13Gazette.articles.reduce(
    (count, unit) =>
      count + unit.officialHtmlToGazetteCorrections.reduce(
        (subtotal, correction) => subtotal + correction.occurrences,
        0,
      ),
    0,
  );
  assert.equal(correctionOccurrences, 5);
  for (const [index, snapshotArticle] of decree13Official.articles.entries()) {
    assert.equal(snapshotArticle.articleNumber, String(index + 1));
  }
  for (const [index, snapshotForm] of decree13Crosscheck.forms.entries()) {
    assert.equal(snapshotForm.title, decree13Gazette.forms[index].title);
  }
  assert.match(article(decree13, 24).fullText, /thời gian dự kiến để xóa, hủy dữ liệu cá nhân/u);
  assert.match(article(decree13, 27).fullText, /xóa không thể khôi phục được hoặc hủy/u);
  assert.match(article(decree13, 37).fullText, /trực thuộc Trung ương/u);
  assert.match(article(decree13, 44).fullText, /trực thuộc Trung ương/u);
});

test("Historical Decree 13 project English preserves audited legal meaning and removes PDF artifacts", () => {
  const englishParagraphs = (number) => article(decree13, number).translations.en.paragraphs;

  assert.match(
    englishParagraphs(11)[15],
    /with the Personal Data Controller or the Personal Data Controller and Processor/u,
  );
  assert.doesNotMatch(englishParagraphs(11)[15], /Controller and process personal data/u);

  assert.match(englishParagraphs(14)[1], /^1\. The data subject may request/u);
  assert.doesNotMatch(englishParagraphs(14)[1], /shall request/u);
  assert.match(englishParagraphs(21)[3], /customers to whom products are introduced/u);
  assert.doesNotMatch(englishParagraphs(21)[3], /customers whose products are introduced/u);

  for (const [articleNumber, index] of [[24, 22], [25, 14]]) {
    assert.match(englishParagraphs(articleNumber)[index], /incomplete or does not comply with regulations/u);
    assert.doesNotMatch(englishParagraphs(articleNumber)[index], /incomplete and in accordance/u);
  }
  assert.match(englishParagraphs(24)[23], /contents of the dossier submitted/u);
  assert.doesNotMatch(englishParagraphs(24)[23], /content of the profile/u);
  assert.match(
    englishParagraphs(25)[1],
    /prepares an Overseas Personal Data Transfer Impact Assessment Dossier/u,
  );
  assert.match(
    englishParagraphs(25)[1],
    /Personal Data Controller, the Personal Data Controller and Processor, the Personal Data Processor, and a Third Party/u,
  );
  assert.doesNotMatch(englishParagraphs(25)[1], /a Overseas|Processors and Controllers/u);
  assert.match(englishParagraphs(25)[15], /complete the dossier/u);
  assert.doesNotMatch(englishParagraphs(25)[15], /complete the application/u);
  assert.match(englishParagraphs(42)[1], /personal data they provide/u);
  assert.doesNotMatch(englishParagraphs(42)[1], /personal data you provide/u);

  const form = (number) => decree13.find((unit) => unit.formNumber === number)
    .translations.en.paragraphs;
  assert.notEqual(form("01")[19], "5");
  for (const [index, artifact] of [[10, "6:"], [15, "7"], [21, "3"], [23, "8:"], [31, "REQUESTER4 9"]]) {
    assert.notEqual(form("02")[index], artifact);
  }
  assert.doesNotMatch(form("03")[8], /dossier10/u);
  assert.doesNotMatch(form("04")[9], /dossier11/u);
  assert.doesNotMatch(form("05")[5], /CONTENTS \.{6}1 12/u);
  assert.doesNotMatch(form("05")[8], /dossier13/u);
  assert.doesNotMatch(form("06")[8], /dossier14/u);
});

test("Current Vietnam regime project-English manifest covers all 94 source-locked nodes", async () => {
  assert.equal(currentEnglishManifest.reviewedAsOf, "2026-07-20");
  assert.equal(currentEnglishManifest.scope.instrumentCount, 2);
  assert.equal(currentEnglishManifest.scope.expectedUnitCount, 94);
  assert.equal(currentEnglishManifest.scope.translatedUnitCount, 94);
  assert.equal(currentEnglishManifest.scope.articleCount, 81);
  assert.equal(currentEnglishManifest.scope.appendixFormCount, 13);
  assert.equal(currentEnglishManifest.scope.sourceParagraphCount, 1881);
  assert.equal(currentEnglishManifest.scope.translationParagraphCount, 1881);
  assert.equal(
    currentEnglishManifest.scope.coverageStatus,
    "complete-current-project-reference",
  );
  assert.match(
    currentEnglishManifest.versionBoundary.commercialTranslationBoundary,
    /were not copied/u,
  );
  assert.equal(currentEnglishManifest.method.sourceHashLock, true);
  assert.equal(currentEnglishManifest.method.paragraphOrderLock, true);
  assert.equal(currentEnglishManifest.method.listMarkerLock, true);
  assert.equal(currentEnglishManifest.method.controlledTerminology, true);
  assert.equal(currentEnglishManifest.rights.projectEnglishLicense, "CC BY 4.0");

  const expected = [
    [law, lawEnglishCatalogue, 39, 332],
    [decree356, decree356EnglishCatalogue, 55, 1549],
  ];
  for (const [units, catalogue, unitCount, paragraphCount] of expected) {
    assert.equal(catalogue.source.unitCount, unitCount);
    assert.equal(catalogue.source.paragraphCount, paragraphCount);
    assert.equal(catalogue.units.length, unitCount);
    for (const [index, catalogueUnit] of catalogue.units.entries()) {
      assert.equal(catalogueUnit.id, units[index].id);
      assert.equal(catalogueUnit.sourceContentSha256, units[index].contentSha256);
      assert.equal(catalogueUnit.sourceParagraphCount, units[index].paragraphs.length);
    }
  }

  const lawEntry = handoff.corpora.find(
    (corpus) => corpus.instrumentId === "vn-personal-data-protection-law-2025",
  );
  const decreeEntry = handoff.corpora.find(
    (corpus) => corpus.instrumentId === "vn-decree-356-2025",
  );
  assert.equal(lawEntry.englishTranslation.translatedUnitCount, 39);
  assert.equal(decreeEntry.englishTranslation.translatedUnitCount, 55);
  for (const entry of [lawEntry, decreeEntry]) {
    assert.equal(
      entry.englishTranslation.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(
      entry.englishTranslation.coverageStatus,
      "complete-current-project-reference",
    );
    assert.equal(entry.englishTranslation.currentTextEquivalent, true);
    assert.equal(entry.englishTranslation.legalEffectStatus, "in-force");
  }
});

test("Current Vietnam project English retains source-checked legal-semantic repairs", () => {
  const lawEnglish = (number, paragraph) =>
    article(law, number).translations.en.paragraphs[paragraph];
  const decreeEnglish = (number, paragraph) =>
    article(decree356, number).translations.en.paragraphs[paragraph];

  assert.equal(
    lawEnglish(2, 6),
    "5. A Personal Data Subject is the person to whom the personal data relates.",
  );
  assert.match(lawEnglish(14, 9), /shall erase or destroy[\s\S]*prevent unauthorized access/u);
  assert.match(lawEnglish(15, 3), /^a\) Provide personal data to the Personal Data Subject/u);
  assert.match(lawEnglish(24, 1), /shall be protected in accordance with this Law/u);
  assert.match(lawEnglish(24, 3), /shall cease in the following cases:$/u);
  assert.match(lawEnglish(25, 2), /^a\) A recruiting agency, organization or individual may request only/u);
  assert.match(lawEnglish(26, 6), /reinsurance or ceding reinsurance/u);
  assert.match(lawEnglish(27, 6), /protect confidentiality while collecting, providing and processing/u);
  assert.equal(
    lawEnglish(28, 3),
    "3. Processing customers' personal data to provide advertising services requires the customers' consent, given with clear knowledge of the content, method, form and frequency of product promotion; the advertising-service provider must provide customers with a means of refusing advertising information.",
  );
  assert.equal(
    lawEnglish(28, 10),
    "b) A means must be established that allows Personal Data Subjects to refuse data sharing; a retention period must be determined; and the data must be erased or destroyed when no longer necessary.",
  );
  assert.match(lawEnglish(29, 6), /listen in on, intercept or record calls/u);
  assert.doesNotMatch(lawEnglish(29, 6), /eavesdrop, eavesdrop/iu);
  assert.match(lawEnglish(31, 5), /^b\) Providers of mobile-application platforms shall/u);

  assert.match(decreeEnglish(9, 12), /anti-money laundering, national security/u);
  assert.doesNotMatch(decreeEnglish(9, 12), /security assurance\.\s*country/iu);
  assert.match(decreeEnglish(18, 19), /complete the Cross-Border Personal Data Transfer Impact Assessment Dossier/u);
  assert.match(decreeEnglish(18, 20), /update and supplement its Cross-Border Personal Data Transfer Impact Assessment Dossier/u);
  assert.doesNotMatch(`${decreeEnglish(18, 19)} ${decreeEnglish(18, 20)}`, /\bthe a\b/iu);
  assert.match(decreeEnglish(19, 2), /^2\. A Personal Data Processing Impact Assessment Dossier/u);
  assert.match(decreeEnglish(19, 14), /^4\. A Personal Data Processing Impact Assessment Dossier must remain available/u);
  assert.equal(
    decreeEnglish(21, 1),
    "1. Services that provide and operate automated systems or software to process personal data on behalf of a Personal Data Controller or Personal Data Controller and Processor.",
  );
  assert.match(decreeEnglish(22, 1), /^1\. A provider must be an organization or enterprise/u);
  assert.match(decreeEnglish(23, 1), /responsibilities and obligations applicable to a Personal Data Controller and Processor or Personal Data Processor/u);
  assert.match(decreeEnglish(23, 6), /^6\. Ensure that personal data are processed[\s\S]*and prevent unauthorized/u);
  assert.match(decreeEnglish(24, 1), /issue, reissue, replace and revoke/u);
  assert.match(decreeEnglish(24, 2), /issue, reissue, replace and revoke/u);
  assert.doesNotMatch(`${decreeEnglish(24, 1)} ${decreeEnglish(24, 2)}`, /renew/iu);
  assert.match(decreeEnglish(25, 21), /The Certificate may be issued in paper or electronic form/u);
  assert.match(decreeEnglish(26, 4), /^2\. Replacement applies/u);
  assert.match(decreeEnglish(26, 6), /decide whether to replace the Certificate/u);
  assert.doesNotMatch(`${decreeEnglish(26, 4)} ${decreeEnglish(26, 6)}`, /renew/iu);
  assert.match(decreeEnglish(28, 6), /Personal Data Processor, or Third Party shall submit notice/u);
  assert.match(
    article(decree356, 28).translations.en.translationBasis.sourceTextNote,
    /signed Vietnamese text reads 'bên xử lý bên thứ ba'/u,
  );
  assert.match(decreeEnglish(31, 1), /on a routine or ad hoc basis/u);
  assert.match(decreeEnglish(31, 5), /^2\. Entities subject to inspection/u);
  assert.match(decreeEnglish(31, 8), /required to conduct a Personal Data Processing Impact Assessment/u);
  assert.match(decreeEnglish(34, 7), /preliminary reviews[\s\S]*final reviews/u);
  assert.doesNotMatch(decreeEnglish(34, 7), /summarize and summarize/iu);
  assert.match(decreeEnglish(39, 2), /Party's positions, guidelines and policies/u);
  assert.doesNotMatch(decreeEnglish(39, 2), /guidelines, guidelines/iu);
  assert.match(decreeEnglish(42, 2), /ceases to have effect on the date this Decree takes effect/u);
  assert.match(decreeEnglish(42, 5), /shall prepare a Personal Data Processing Impact Assessment Dossier/u);
  assert.match(decreeEnglish(42, 5), /is not required to conduct the risk assessment/u);
  assert.doesNotMatch(decreeEnglish(42, 5), /carry out a dossier|Do not have to/iu);

  assert.match(decreeEnglish(7, 17), /and must take measures to prevent/u);
  assert.match(decreeEnglish(9, 11), /; and assign access permissions/u);
  assert.match(decreeEnglish(12, 3), /; provide information[\s\S]*; and comply/u);
  assert.match(decreeEnglish(33, 1), /; and organize the implementation/u);
  assert.match(decreeEnglish(35, 2), /; research and apply[\s\S]*; and conduct international cooperation/u);

  const currentArticles = [
    ...law,
    ...decree356.filter((unit) => unit.unitType === "article"),
  ];
  for (const unit of currentArticles) {
    for (const paragraph of unit.translations.en.paragraphs) {
      assert.doesNotMatch(
        paragraph,
        /;\s+(?!Clause\b|Point\b|Article\b)[A-Z][a-z]+\b/u,
        `${unit.id}: ${paragraph}`,
      );
    }
  }
});

test("Decree 356 English appendix forms retain readable legal fields and normalized table terminology", () => {
  const forms = decree356.filter((unit) => unit.unitType === "appendix-form");
  assert.equal(forms.length, 13);
  for (const form of forms) {
    const english = form.translations.en;
    assert.ok(english.title.length > 20, form.id);
    assert.equal(english.paragraphs.length, form.paragraphs.length, form.id);
    assert.doesNotMatch(
      english.fullText,
      /Fish data|Personal Personal|31\s*\/\s*12|cents individual|muscles law enforcement|mobile characteristics transmit|official\/fish|favorable to evil|whether personal piercing|Reason, grandmother/iu,
      form.id,
    );
  }
  const form01a = forms.find((unit) => unit.formNumber === "01a").translations.en.fullText;
  assert.match(form01a, /Cross-Border Personal Data Transfer Impact Assessment Dossier/u);
  assert.match(form01a, /Specialized Personal Data Protection Agency/u);
  const form05 = forms.find((unit) => unit.formNumber === "05").translations.en.fullText;
  assert.match(form05, /Certificate of Eligibility to Provide Personal Data Processing Services/u);
  assert.match(form05, /HEREBY CERTIFIES/u);
  assert.doesNotMatch(form05, /^;$/mu);
  const form09 = forms.find((unit) => unit.formNumber === "09").translations.en.fullText;
  assert.match(form09, /Biometric and genetic[\s\S]*data/u);
  assert.match(form09, /law-enforcement agencies/u);
  assert.match(form09, /Services for online collection and processing of[\s\S]*personal data/u);
  assert.match(form09, /Tax[\s\S]*identification[\s\S]*number/u);
  assert.doesNotMatch(form09, /vehicles and equipment\s+equipment/iu);
  const form10 = forms.find((unit) => unit.formNumber === "10").translations.en.fullText;
  assert.match(form10, /Personal Data Controller or Personal Data Controller and Processor/u);
  assert.match(form10, /Personal Data Processor/u);
  assert.match(form10, /Data revealing an individual's sex life or[\s\S]*sexual orientation/u);
  assert.match(form10, /PART B\. INFORMATION ON PARTIES INVOLVED IN PERSONAL DATA PROCESSING/u);

  const footnoteIndexes = new Map([
    ["01a", [33, 49]],
    ["02a", [33, 49]],
    ["03a", [33, 36, 51]],
    ["03b", [31]],
    ["04", [34, 61]],
    ["06", [35, 63]],
    ["08", [35, 58]],
  ]);
  for (const [formNumber, indexes] of footnoteIndexes) {
    const paragraphs = forms.find((unit) => unit.formNumber === formNumber).translations.en.paragraphs;
    for (const index of indexes) {
      assert.match(paragraphs[index], /^Footnote \d+:$/u, `Form ${formNumber} paragraph ${index}`);
    }
  }
});

test("Historical Decree 13 project-English manifest covers all 50 source-locked nodes", async () => {
  assert.equal(decree13EnglishManifest.instrumentId, "vn-decree-13-2023");
  assert.equal(decree13EnglishManifest.scope.expectedUnitCount, 50);
  assert.equal(decree13EnglishManifest.scope.translatedUnitCount, 50);
  assert.equal(decree13EnglishManifest.scope.articleCount, 44);
  assert.equal(decree13EnglishManifest.scope.appendixFormCount, 6);
  assert.equal(decree13EnglishManifest.scope.sourceParagraphCount, 621);
  assert.equal(decree13EnglishManifest.scope.translationParagraphCount, 621);
  assert.equal(
    decree13EnglishManifest.scope.coverageStatus,
    "complete-historical-project-reference",
  );
  assert.equal(decree13EnglishManifest.legalLifecycle.status, "repealed");
  assert.equal(decree13EnglishManifest.legalLifecycle.repealedFrom, "2026-01-01");
  assert.match(
    decree13EnglishManifest.versionBoundary.commercialTranslationBoundary,
    /were not copied/u,
  );
  assert.equal(decree13EnglishManifest.method.sourceHashLock, true);
  assert.equal(decree13EnglishManifest.method.paragraphOrderLock, true);
  assert.equal(decree13EnglishManifest.method.listMarkerLock, true);
  assert.equal(decree13EnglishManifest.rights.projectEnglishLicense, "CC BY 4.0");
  const catalogueBytes = await readFile(
    new URL(decree13EnglishManifest.method.cataloguePath.replace("data/v2/", ""), dataRoot),
  );
  assert.equal(sha256(catalogueBytes), decree13EnglishManifest.method.catalogueSha256);
  assert.equal(decree13EnglishCatalogue.units.length, 50);
  assert.equal(decree13EnglishCatalogue.source.paragraphCount, 621);
  for (const [index, catalogueUnit] of decree13EnglishCatalogue.units.entries()) {
    assert.equal(catalogueUnit.id, decree13[index].id);
    assert.equal(catalogueUnit.sourceContentSha256, decree13[index].contentSha256);
    assert.equal(catalogueUnit.sourceParagraphCount, decree13[index].paragraphs.length);
  }

  const handoffEntry = handoff.corpora.find(
    (corpus) => corpus.instrumentId === "vn-decree-13-2023",
  );
  assert.equal(handoffEntry.englishTranslation.translatedUnitCount, 50);
  assert.equal(
    handoffEntry.englishTranslation.status,
    "project-authored-reference-translation-no-legal-effect",
  );
  assert.equal(handoffEntry.englishTranslation.legalEffectStatus, "repealed");
});

test("Vietnam handoff manifest pins output and source-snapshot hashes", async () => {
  assert.equal(handoff.reviewedAsOf, "2026-07-20");
  assert.equal(handoff.corpora.length, 3);
  assert.deepEqual(
    handoff.corpora.map((corpus) => corpus.coverage.actualUnitCount),
    [39, 55, 50],
  );
  assert.ok(handoff.corpora.every((corpus) => corpus.coverage.complete));
  assert.equal(handoff.integration.status, "not-performed-by-design");
  assert.ok(handoff.integration.cautions.some((value) => /historical-only/u.test(value)));

  for (const corpus of handoff.corpora) {
    const output = await readFile(
      new URL(corpus.output.path.replace("data/v2/", ""), dataRoot),
    );
    assert.equal(sha256(output), corpus.output.sha256, corpus.output.path);
    for (const snapshot of corpus.sourceSnapshots) {
      const relative = snapshot.path.replace("data/v2/", "");
      const bytes = await readFile(new URL(relative, dataRoot));
      assert.equal(sha256(bytes), snapshot.sha256, snapshot.path);
    }
  }
});
