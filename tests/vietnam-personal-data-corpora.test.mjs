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

const [law, decree356, decree13, handoff, lawGazette, decree356Gazette, decree13Gazette, decree13Official, decree13Crosscheck] =
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
  assert.equal(unit.englishAvailability.status, "not-supplied");
  assert.match(unit.englishAvailability.note, /No complete official Government English version/u);
  assert.ok(!Object.hasOwn(unit, "translations"));
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
