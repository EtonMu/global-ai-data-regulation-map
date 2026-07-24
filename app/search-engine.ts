export type SearchDocumentType = "instrument" | "provision" | "concept";

export type SearchTranslation =
  | string
  | {
      title?: string;
      originalTitle?: string;
      fullText?: string;
      paragraphs?: readonly string[];
    };

/**
 * A presentation-neutral record shared by instruments, provisions and concepts.
 * Callers keep control of the label and navigation metadata; the search engine
 * only reads the optional searchable fields.
 */
export type SearchDocument = {
  id: string;
  type: SearchDocumentType;
  label: string;
  title?: string;
  shortTitle?: string;
  originalTitle?: string;
  locator?: string;
  instrumentId?: string;
  instrumentShortTitle?: string;
  jurisdiction?: string;
  aliases?: readonly string[];
  summary?: string;
  description?: string;
  keywords?: readonly string[];
  conceptIds?: readonly string[];
  fullText?: string;
  translations?:
    | readonly SearchTranslation[]
    | Readonly<Record<string, SearchTranslation>>;
};

export type SearchConceptProfile = {
  id: string;
  label: string;
  aliases?: readonly string[];
  description?: string;
  summary?: string;
  searchTerms?: readonly string[];
};

export type SearchMatchKind =
  | "exact"
  | "prefix"
  | "fuzzy"
  | "semantic"
  | "full-text";

export type SearchResult = {
  document: SearchDocument;
  score: number;
  matchKind: SearchMatchKind;
  reason: string;
  matchedConceptId?: string;
};

export type SearchOptions = {
  limit?: number;
  typeQuotas?: Partial<Record<SearchDocumentType, number>>;
};

type FieldKind =
  | "short title"
  | "title"
  | "original-language title"
  | "locator"
  | "alias"
  | "jurisdiction"
  | "keyword"
  | "summary"
  | "description"
  | "identifier"
  | "full text";

type IndexedField = {
  kind: FieldKind;
  value: string;
  normalized: string;
  words: readonly string[];
  tokens: readonly string[];
  weight: number;
  fullText: boolean;
  fuzzyPreferred: boolean;
};

type IndexedDocument = {
  document: SearchDocument;
  fields: readonly IndexedField[];
  conceptIds: readonly string[];
};

type IndexedConceptProfile = {
  profile: SearchConceptProfile;
  primaryTerms: readonly string[];
  contextualTerms: readonly string[];
  semanticTerms: readonly string[];
  primaryTokens: readonly string[];
  contextualTokens: readonly string[];
};

/**
 * SearchIndex is intentionally read-only. Its maps are implementation details,
 * exposed in the type only so the index can remain a plain local value without
 * a class or runtime dependency.
 */
export type SearchIndex = {
  readonly documents: readonly SearchDocument[];
  readonly conceptProfiles: readonly SearchConceptProfile[];
  readonly indexedDocuments: readonly IndexedDocument[];
  readonly indexedConceptProfiles: readonly IndexedConceptProfile[];
  readonly trigramDocuments: ReadonlyMap<string, ReadonlySet<number>>;
  readonly preferredFuzzyDocuments: ReadonlySet<number>;
};

type FieldMatch = {
  score: number;
  kind: Exclude<SearchMatchKind, "semantic">;
  reason: string;
};

type ConceptIntent = {
  conceptId: string;
  label: string;
  confidence: number;
};

const fieldWeights: Record<FieldKind, number> = {
  "short title": 14,
  locator: 13,
  title: 11,
  "original-language title": 11,
  alias: 10,
  jurisdiction: 7,
  keyword: 6,
  identifier: 5,
  description: 4,
  summary: 3,
  "full text": 1,
};

const matchKindOrder: Record<SearchMatchKind, number> = {
  exact: 5,
  prefix: 4,
  fuzzy: 3,
  semantic: 2,
  "full-text": 1,
};

const typeOrder: Record<SearchDocumentType, number> = {
  concept: 0,
  instrument: 1,
  provision: 2,
};

const structuralTokens: Readonly<Record<string, string>> = {
  art: "article",
  arts: "article",
  article: "article",
  articles: "article",
  sec: "section",
  secs: "section",
  section: "section",
  sections: "section",
  para: "paragraph",
  paras: "paragraph",
  paragraph: "paragraph",
  paragraphs: "paragraph",
  cl: "clause",
  cls: "clause",
  clause: "clause",
  clauses: "clause",
};

/*
 * These are retrieval aids, not translations or assertions of legal
 * equivalence. They cover common natural-language phrasings absent from the
 * editorial concept aliases. A caller can extend them with searchTerms.
 */
const ontologySearchTerms: Readonly<Record<string, readonly string[]>> = {
  "cross-border-transfer": [
    "send data abroad",
    "data sent abroad",
    "move data overseas",
    "overseas data transfer",
    "data export",
    "数据出境",
    "跨境传输",
    "跨境提供",
    "資料出境",
    "跨境傳輸",
    "越境移転",
    "国外移転",
    "국외 이전",
    "transfert international",
    "transfert transfrontalier",
    "transferência internacional",
    "transferencia internacional",
    "chuyển dữ liệu xuyên biên giới",
    "transfer data lintas batas",
    "نقل البيانات عبر الحدود",
  ],
  "data-minimization": [
    "collect only what is needed",
    "only necessary data",
    "最小必要",
    "最少收集",
    "数据最小化",
    "資料最小化",
    "データ最小化",
    "최소 수집",
  ],
  "privacy-by-design-default": [
    "build privacy in",
    "private by design",
    "隐私设计",
    "預設保護隱私",
    "プライバシーバイデザイン",
    "개인정보 보호 중심 설계",
  ],
  "automated-decision-safeguards": [
    "automated decision making",
    "right to contest an automated decision",
    "自动化决策",
    "自動化決策",
    "自動意思決定",
    "자동화된 결정",
  ],
  "transparency-explainability": [
    "right to an explanation",
    "why did the model decide",
    "透明度",
    "可解释性",
    "可解釋性",
    "説明可能性",
    "설명 가능성",
  ],
  "fairness-nondiscrimination": [
    "algorithmic bias",
    "biased algorithm",
    "算法歧视",
    "算法歧視",
    "アルゴリズム差別",
    "알고리즘 차별",
  ],
  "impact-assessment": [
    "assess impact before deployment",
    "影响评估",
    "影響評估",
    "影響評価",
    "영향평가",
  ],
  "security-controls": [
    "protect systems from attack",
    "网络安全",
    "網絡安全",
    "サイバーセキュリティ",
    "사이버 보안",
  ],
  "incident-response": [
    "report a data breach",
    "breach notification",
    "数据泄露通知",
    "資料外洩通知",
    "漏えい通知",
    "유출 통지",
  ],
  "human-oversight": [
    "human intervention",
    "人工监督",
    "人工監督",
    "人間による監督",
    "인간의 감독",
  ],
};

function textValues(values: readonly (string | undefined)[]) {
  return values.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
}

function foldLatinMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .replace(/[đð]/gu, "d")
    .replace(/ł/gu, "l")
    .replace(/ø/gu, "o")
    .replace(/þ/gu, "th")
    .replace(/æ/gu, "ae")
    .replace(/œ/gu, "oe")
    .normalize("NFC");
}

/**
 * Locale-neutral search normalization. It deliberately leaves Han, Kana,
 * Hangul and Arabic letters intact while folding Latin diacritics.
 */
export function normalizeSearchText(value: string) {
  const folded = foldLatinMarks(value.normalize("NFKC").toLowerCase());
  const words = folded
    .replace(/[‐‑‒–—―]/gu, "-")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => structuralTokens[word] ?? word);
  return words.join(" ");
}

function wordTokens(normalized: string) {
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

function containsEastAsianScript(value: string) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(
    value,
  );
}

function ngrams(value: string, size: number) {
  const characters = Array.from(value);
  if (characters.length < size) return [value];
  const result: string[] = [];
  for (let index = 0; index <= characters.length - size; index += 1) {
    result.push(characters.slice(index, index + size).join(""));
  }
  return result;
}

function searchableTokens(normalized: string) {
  const output = new Set<string>();
  for (const word of wordTokens(normalized)) {
    output.add(word);
    if (containsEastAsianScript(word) && Array.from(word).length > 1) {
      for (const gram of ngrams(word, 2)) output.add(gram);
      if (Array.from(word).length > 2) {
        for (const gram of ngrams(word, 3)) output.add(gram);
      }
    }
  }
  return [...output];
}

function fuzzyTrigrams(value: string) {
  const compact = value.replace(/\s+/gu, "");
  const characters = Array.from(compact);
  if (characters.length <= 2) return [compact];
  return ngrams(`^${compact}$`, 3);
}

function trigramSimilarity(left: string, right: string) {
  const leftGrams = new Set(fuzzyTrigrams(left));
  const rightGrams = new Set(fuzzyTrigrams(right));
  let shared = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) shared += 1;
  }
  return (2 * shared) / Math.max(1, leftGrams.size + rightGrams.size);
}

function boundedDamerauLevenshtein(left: string, right: string, maximum: number) {
  const leftCharacters = Array.from(left);
  const rightCharacters = Array.from(right);
  if (Math.abs(leftCharacters.length - rightCharacters.length) > maximum) {
    return maximum + 1;
  }

  const rows = leftCharacters.length + 1;
  const columns = rightCharacters.length + 1;
  const matrix = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution =
        leftCharacters[row - 1] === rightCharacters[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitution,
      );
      if (
        row > 1 &&
        column > 1 &&
        leftCharacters[row - 1] === rightCharacters[column - 2] &&
        leftCharacters[row - 2] === rightCharacters[column - 1]
      ) {
        matrix[row][column] = Math.min(
          matrix[row][column],
          matrix[row - 2][column - 2] + 1,
        );
      }
    }
  }
  return matrix[leftCharacters.length][rightCharacters.length];
}

function addField(
  fields: IndexedField[],
  seen: Map<string, number>,
  kind: FieldKind,
  value: string | undefined,
  options?: { weight?: number; fullText?: boolean; fuzzyPreferred?: boolean },
) {
  if (!value?.trim()) return;
  const normalized = normalizeSearchText(value);
  if (!normalized) return;
  const weight = options?.weight ?? fieldWeights[kind];
  const dedupeKey = `${kind}:${normalized}`;
  const existingIndex = seen.get(dedupeKey);
  if (existingIndex !== undefined) {
    if (fields[existingIndex].weight < weight) {
      fields[existingIndex] = { ...fields[existingIndex], weight };
    }
    return;
  }
  seen.set(dedupeKey, fields.length);
  const fullText = options?.fullText ?? false;
  fields.push({
    kind,
    value: value.trim(),
    normalized,
    // Full legal text remains phrase-searchable, but does not enter the fuzzy
    // token/trigram layer. This keeps the optional 23 MB corpus from creating
    // a much larger in-memory postings graph in the browser.
    words: fullText ? [] : wordTokens(normalized),
    tokens: fullText ? [] : searchableTokens(normalized),
    weight,
    fullText,
    fuzzyPreferred: options?.fuzzyPreferred ?? weight >= 10,
  });
}

function addTranslationFields(
  fields: IndexedField[],
  seen: Map<string, number>,
  translations: SearchDocument["translations"],
) {
  if (!translations) return;
  const values = Array.isArray(translations)
    ? translations
    : Object.values(translations);
  for (const translation of values) {
    if (typeof translation === "string") {
      addField(fields, seen, "full text", translation, { fullText: true });
      continue;
    }
    addField(fields, seen, "title", translation.title);
    addField(fields, seen, "original-language title", translation.originalTitle);
    addField(fields, seen, "full text", translation.fullText, { fullText: true });
    if (translation.paragraphs?.length) {
      addField(fields, seen, "full text", translation.paragraphs.join(" "), {
        fullText: true,
      });
    }
  }
}

function indexDocument(document: SearchDocument): IndexedDocument {
  const fields: IndexedField[] = [];
  const seen = new Map<string, number>();
  addField(fields, seen, "title", document.label, {
    weight: document.type === "concept" ? 14 : 11,
  });
  addField(fields, seen, "title", document.title);
  addField(fields, seen, "short title", document.shortTitle);
  addField(fields, seen, "original-language title", document.originalTitle);
  addField(fields, seen, "locator", document.locator);
  addField(fields, seen, "identifier", document.id);
  addField(fields, seen, "identifier", document.instrumentId);
  addField(fields, seen, "jurisdiction", document.jurisdiction);
  for (const alias of document.aliases ?? []) {
    addField(fields, seen, "alias", alias);
  }
  for (const keyword of document.keywords ?? []) {
    addField(fields, seen, "keyword", keyword);
  }
  addField(fields, seen, "summary", document.summary);
  addField(fields, seen, "description", document.description);
  addField(fields, seen, "full text", document.fullText, { fullText: true });
  addTranslationFields(fields, seen, document.translations);

  if (document.instrumentShortTitle && document.locator) {
    addField(
      fields,
      seen,
      "locator",
      `${document.instrumentShortTitle} ${document.locator}`,
      { weight: 15 },
    );
  }

  const conceptIds = new Set(document.conceptIds ?? []);
  if (document.type === "concept") conceptIds.add(document.id);
  return { document, fields, conceptIds: [...conceptIds] };
}

function indexConceptProfile(profile: SearchConceptProfile): IndexedConceptProfile {
  const primaryTerms = textValues([
    profile.label,
    ...(profile.aliases ?? []),
    ...(profile.searchTerms ?? []),
  ]).map(normalizeSearchText);
  const contextualTerms = textValues([
    profile.description,
    profile.summary,
  ]).map(normalizeSearchText);
  const semanticTerms = (ontologySearchTerms[profile.id] ?? []).map(
    normalizeSearchText,
  );
  return {
    profile,
    primaryTerms: [...new Set(primaryTerms)],
    contextualTerms: [...new Set(contextualTerms)],
    semanticTerms: [...new Set(semanticTerms)],
    primaryTokens: [
      ...new Set(primaryTerms.flatMap((term) => wordTokens(term))),
    ],
    contextualTokens: [
      ...new Set(contextualTerms.flatMap((term) => wordTokens(term))),
    ],
  };
}

export function createSearchIndex(
  documents: readonly SearchDocument[],
  conceptProfiles: readonly SearchConceptProfile[] = [],
): SearchIndex {
  const uniqueDocuments: SearchDocument[] = [];
  const seenDocuments = new Set<string>();
  for (const document of documents) {
    const key = `${document.type}:${document.id}`;
    if (seenDocuments.has(key)) continue;
    seenDocuments.add(key);
    uniqueDocuments.push(document);
  }

  const uniqueProfiles: SearchConceptProfile[] = [];
  const seenProfiles = new Set<string>();
  for (const profile of conceptProfiles) {
    if (seenProfiles.has(profile.id)) continue;
    seenProfiles.add(profile.id);
    uniqueProfiles.push(profile);
  }

  const indexedDocuments = uniqueDocuments.map(indexDocument);
  const trigramDocuments = new Map<string, Set<number>>();
  const preferredFuzzyDocuments = new Set<number>();
  indexedDocuments.forEach((entry, documentIndex) => {
    for (const field of entry.fields) {
      if (field.fuzzyPreferred) preferredFuzzyDocuments.add(documentIndex);
      for (const token of field.tokens) {
        if (Array.from(token).length < 4 || containsEastAsianScript(token)) {
          continue;
        }
        for (const gram of fuzzyTrigrams(token)) {
          const postings = trigramDocuments.get(gram) ?? new Set<number>();
          postings.add(documentIndex);
          trigramDocuments.set(gram, postings);
        }
      }
    }
  });

  return {
    documents: uniqueDocuments,
    conceptProfiles: uniqueProfiles,
    indexedDocuments,
    indexedConceptProfiles: uniqueProfiles.map(indexConceptProfile),
    trigramDocuments,
    preferredFuzzyDocuments,
  };
}

function containsPhrase(field: string, query: string) {
  return (` ${field} `).includes(` ${query} `);
}

function exactOrPrefixMatch(
  field: IndexedField,
  query: string,
  queryWords: readonly string[],
  shortQuery: boolean,
): FieldMatch | null {
  const fullTextKind: SearchMatchKind = field.fullText ? "full-text" : "exact";
  if (field.normalized === query) {
    return {
      score: field.weight * 4,
      kind: fullTextKind,
      reason: field.fullText
        ? "Full-text phrase match"
        : `Exact ${field.kind}: ${field.value}`,
    };
  }
  if (containsPhrase(field.normalized, query)) {
    return {
      score: field.weight * 3.2,
      kind: fullTextKind,
      reason: field.fullText
        ? "Full-text phrase match"
        : `Exact phrase in ${field.kind}: ${field.value}`,
    };
  }

  const fieldWordSet = new Set(field.words);
  if (queryWords.length > 0 && queryWords.every((word) => fieldWordSet.has(word))) {
    return {
      score: field.weight * (queryWords.length === 1 ? 2.5 : 2.8),
      kind: fullTextKind,
      reason: field.fullText
        ? "Full-text term match"
        : `Exact terms in ${field.kind}: ${field.value}`,
    };
  }
  if (shortQuery) return null;

  if (
    field.normalized.startsWith(query) ||
    (queryWords.length > 0 &&
      queryWords.every((queryWord) =>
        field.words.some((fieldWord) => fieldWord.startsWith(queryWord)),
      ))
  ) {
    return {
      score: field.weight * 2,
      kind: field.fullText ? "full-text" : "prefix",
      reason: field.fullText
        ? "Full-text prefix match"
        : `Prefix match in ${field.kind}: ${field.value}`,
    };
  }
  return null;
}

function fuzzyMaximum(tokenLength: number) {
  if (tokenLength < 4) return 0;
  if (tokenLength <= 6) return 1;
  return 2;
}

function fuzzyFieldMatch(
  field: IndexedField,
  queryWords: readonly string[],
): FieldMatch | null {
  if (!queryWords.length || queryWords.some((word) => Array.from(word).length < 4)) {
    return null;
  }

  let similarityTotal = 0;
  const corrections: string[] = [];
  for (const queryWord of queryWords) {
    const maximum = fuzzyMaximum(Array.from(queryWord).length);
    let best:
      | { token: string; distance: number; similarity: number }
      | undefined;
    for (const fieldWord of field.words) {
      const lengthDelta = Math.abs(
        Array.from(queryWord).length - Array.from(fieldWord).length,
      );
      if (lengthDelta > maximum) continue;
      const gramSimilarity = trigramSimilarity(queryWord, fieldWord);
      if (
        gramSimilarity < (Array.from(queryWord).length <= 4 ? 0.18 : 0.28) &&
        !field.fuzzyPreferred
      ) {
        continue;
      }
      const distance = boundedDamerauLevenshtein(
        queryWord,
        fieldWord,
        maximum,
      );
      if (distance > maximum) continue;
      const similarity =
        1 - distance / Math.max(Array.from(queryWord).length, Array.from(fieldWord).length);
      if (
        !best ||
        similarity > best.similarity ||
        (similarity === best.similarity && fieldWord < best.token)
      ) {
        best = { token: fieldWord, distance, similarity };
      }
    }
    if (!best) return null;
    similarityTotal += best.similarity;
    if (best.distance > 0) {
      corrections.push(`“${queryWord}” → “${best.token}”`);
    }
  }

  const averageSimilarity = similarityTotal / queryWords.length;
  return {
    score: field.weight * 1.7 * averageSimilarity,
    kind: field.fullText ? "full-text" : "fuzzy",
    reason: field.fullText
      ? `Fuzzy full-text match: ${corrections.join(", ")}`
      : `Fuzzy match: ${corrections.join(", ")}`,
  };
}

function fuzzyCandidateDocuments(index: SearchIndex, queryWords: readonly string[]) {
  const candidates = new Set<number>();
  for (const queryWord of queryWords) {
    if (Array.from(queryWord).length < 4 || containsEastAsianScript(queryWord)) {
      continue;
    }
    for (const gram of fuzzyTrigrams(queryWord)) {
      for (const documentIndex of index.trigramDocuments.get(gram) ?? []) {
        candidates.add(documentIndex);
      }
    }
    if (Array.from(queryWord).length <= 4) {
      for (const documentIndex of index.preferredFuzzyDocuments) {
        candidates.add(documentIndex);
      }
    }
  }
  return candidates;
}

function termIntentConfidence(
  query: string,
  queryWords: readonly string[],
  term: string,
  contextual: boolean,
) {
  if (!term) return 0;
  if (term === query) return contextual ? 0.76 : 1;
  if (
    Array.from(query).length >= 3 &&
    (containsPhrase(term, query) || containsPhrase(query, term))
  ) {
    return contextual ? 0.7 : 0.9;
  }
  const termWords = new Set(wordTokens(term));
  if (
    queryWords.length >= 2 &&
    queryWords.every((queryWord) => termWords.has(queryWord))
  ) {
    return contextual ? 0.68 : 0.84;
  }

  if (queryWords.length >= 2) {
    const candidateWords = [...termWords];
    let shared = 0;
    for (const queryWord of queryWords) {
      const queryLength = Array.from(queryWord).length;
      const matched = candidateWords.some((candidateWord) => {
        if (candidateWord === queryWord) return true;
        if (
          queryLength >= 4 &&
          (candidateWord.startsWith(queryWord) ||
            queryWord.startsWith(candidateWord))
        ) {
          return true;
        }
        if (queryLength < 5 || containsEastAsianScript(queryWord)) return false;
        const maximum = fuzzyMaximum(queryLength);
        if (Math.abs(candidateWord.length - queryWord.length) > maximum) {
          return false;
        }
        return (
          boundedDamerauLevenshtein(queryWord, candidateWord, maximum) <=
          maximum
        );
      });
      if (matched) shared += 1;
    }
    if (shared >= Math.min(2, queryWords.length)) {
      const queryCoverage = shared / queryWords.length;
      const termCoverage = shared / Math.max(1, termWords.size);
      const confidence =
        (contextual ? 0.54 : 0.61) +
        0.18 * queryCoverage +
        0.08 * Math.min(1, termCoverage);
      return Math.min(contextual ? 0.78 : 0.88, confidence);
    }
  }
  return 0;
}

function conceptIntents(
  profiles: readonly IndexedConceptProfile[],
  query: string,
  queryWords: readonly string[],
  shortQuery: boolean,
) {
  if (shortQuery) return [];
  const intents: ConceptIntent[] = [];
  for (const entry of profiles) {
    let confidence = 0;
    for (const term of entry.primaryTerms) {
      confidence = Math.max(
        confidence,
        termIntentConfidence(query, queryWords, term, false),
      );
    }
    for (const term of entry.semanticTerms) {
      confidence = Math.max(
        confidence,
        termIntentConfidence(query, queryWords, term, false),
      );
    }
    for (const term of entry.contextualTerms) {
      confidence = Math.max(
        confidence,
        termIntentConfidence(query, queryWords, term, true),
      );
    }

    if (
      confidence < 0.68 &&
      queryWords.length === 1 &&
      Array.from(queryWords[0]).length >= 4
    ) {
      const queryWord = queryWords[0];
      const maximum = fuzzyMaximum(Array.from(queryWord).length);
      for (const token of entry.primaryTokens) {
        if (Math.abs(token.length - queryWord.length) > maximum) continue;
        if (trigramSimilarity(queryWord, token) < 0.28) continue;
        const distance = boundedDamerauLevenshtein(queryWord, token, maximum);
        if (distance > 0 && distance <= maximum) {
          confidence = Math.max(
            confidence,
            0.7 * (1 - distance / Math.max(queryWord.length, token.length)),
          );
        }
      }
    }

    if (confidence >= 0.62) {
      intents.push({
        conceptId: entry.profile.id,
        label: entry.profile.label,
        confidence,
      });
    }
  }
  return intents
    .sort(
      (left, right) =>
        right.confidence - left.confidence ||
        compareText(left.conceptId, right.conceptId),
    )
    .slice(0, 4);
}

function betterFieldMatch(
  current: FieldMatch | null,
  candidate: FieldMatch | null,
) {
  if (!candidate) return current;
  if (!current) return candidate;
  if (candidate.score !== current.score) {
    return candidate.score > current.score ? candidate : current;
  }
  return matchKindOrder[candidate.kind] > matchKindOrder[current.kind]
    ? candidate
    : current;
}

function compareText(left: string, right: string) {
  const normalizedLeft = normalizeSearchText(left);
  const normalizedRight = normalizeSearchText(right);
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizedLimit(value: number | undefined) {
  if (value === undefined) return 10;
  if (!Number.isFinite(value)) return 10;
  return Math.max(0, Math.floor(value));
}

export function searchIndex(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchResult[] {
  const query = normalizeSearchText(rawQuery);
  const limit = normalizedLimit(options.limit);
  if (!query || limit === 0) return [];

  const queryWords = wordTokens(query);
  const shortQuery =
    Array.from(query.replace(/\s+/gu, "")).length < 3;
  const fuzzyCandidates = shortQuery
    ? new Set<number>()
    : fuzzyCandidateDocuments(index, queryWords);
  const intents = conceptIntents(
    index.indexedConceptProfiles,
    query,
    queryWords,
    shortQuery,
  );
  const intentById = new Map(
    intents.map((intent) => [intent.conceptId, intent]),
  );

  const results: SearchResult[] = [];
  index.indexedDocuments.forEach((entry, documentIndex) => {
    let bestFieldMatch: FieldMatch | null = null;
    for (const field of entry.fields) {
      bestFieldMatch = betterFieldMatch(
        bestFieldMatch,
        exactOrPrefixMatch(field, query, queryWords, shortQuery),
      );
    }
    if (!bestFieldMatch && fuzzyCandidates.has(documentIndex)) {
      for (const field of entry.fields) {
        bestFieldMatch = betterFieldMatch(
          bestFieldMatch,
          fuzzyFieldMatch(field, queryWords),
        );
      }
    }

    const semanticMatches = entry.conceptIds
      .map((conceptId) => intentById.get(conceptId))
      .filter((intent): intent is ConceptIntent => Boolean(intent))
      .sort(
        (left, right) =>
          right.confidence - left.confidence ||
          compareText(left.conceptId, right.conceptId),
      );
    const bestSemantic = semanticMatches[0];
    const semanticScore = semanticMatches
      .slice(0, 3)
      .reduce(
        (total, intent, position) =>
          total + 22 * intent.confidence * (position === 0 ? 1 : 0.35),
        0,
      );
    if (!bestFieldMatch && !bestSemantic) return;

    const lexicalScore = bestFieldMatch?.score ?? 0;
    const lexicalIsStrong =
      bestFieldMatch?.kind === "exact" || bestFieldMatch?.kind === "prefix";
    const semanticIsPrimary =
      Boolean(bestSemantic) &&
      (!bestFieldMatch ||
        (!lexicalIsStrong && semanticScore > lexicalScore * 1.1));
    const singleTermInstrumentBoost =
      bestFieldMatch?.kind === "fuzzy" &&
      queryWords.length === 1 &&
      entry.document.type === "instrument"
        ? 5
        : 0;
    const score = lexicalScore + semanticScore + singleTermInstrumentBoost;
    const matchKind: SearchMatchKind = semanticIsPrimary
      ? "semantic"
      : bestFieldMatch!.kind;
    const reason = semanticIsPrimary
      ? `Semantic match via ${bestSemantic!.label}`
      : bestFieldMatch!.reason;
    const matchedConceptId =
      bestSemantic?.conceptId ??
      (entry.document.type === "concept" ? entry.document.id : undefined);

    results.push({
      document: entry.document,
      score: Number(score.toFixed(4)),
      matchKind,
      reason,
      ...(matchedConceptId ? { matchedConceptId } : {}),
    });
  });

  results.sort(
    (left, right) =>
      right.score - left.score ||
      matchKindOrder[right.matchKind] - matchKindOrder[left.matchKind] ||
      typeOrder[left.document.type] - typeOrder[right.document.type] ||
      compareText(left.document.label, right.document.label) ||
      compareText(left.document.id, right.document.id),
  );

  const quotas = options.typeQuotas;
  if (!quotas) return results.slice(0, limit);
  const counts: Record<SearchDocumentType, number> = {
    instrument: 0,
    provision: 0,
    concept: 0,
  };
  const selected: SearchResult[] = [];
  for (const result of results) {
    const quota = quotas[result.document.type];
    if (quota !== undefined && counts[result.document.type] >= Math.max(0, quota)) {
      continue;
    }
    counts[result.document.type] += 1;
    selected.push(result);
    if (selected.length >= limit) break;
  }
  return selected;
}
