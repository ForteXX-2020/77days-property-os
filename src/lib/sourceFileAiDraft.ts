import { generateOpenAiJson, getOpenAiModel } from "@/lib/openaiServer";
import type { Json, SourceFileRow } from "@/types/supabase";

type ExtractedJsonEnvelope = {
  parser_result: Json;
  ai_draft?: Json;
  extraction_history?: Json[];
};

type AiDraftValidationResult = {
  valid: boolean;
  warnings: string[];
};

const MAX_EXTRACT_TEXT_CHARS = 24000;
const MAX_EXTRACT_JSON_CHARS = 24000;
const DEAL_CANDIDATE_KEYS = [
  "property_name",
  "address",
  "asking_price",
  "gross_yield_full",
  "current_yield",
  "monthly_rent_full",
  "annual_rent_full",
  "monthly_rent_current",
  "annual_rent_current",
  "property_type",
  "structure",
  "built_year",
  "building_age",
  "land_area",
  "building_area",
  "total_units",
  "nearest_station",
  "walk_minutes",
  "broker_name",
  "memo"
] as const;
const DEAL_UNIT_KEYS = [
  "unit_name",
  "floor_area",
  "layout",
  "rent_current",
  "common_fee",
  "parking_fee",
  "other_fee",
  "total_monthly_rent",
  "occupancy_status",
  "tenant_name_masked",
  "notes"
] as const;
const SIMULATION_CANDIDATE_KEYS = [
  "purchase_price",
  "monthly_rent_full",
  "annual_rent_full",
  "monthly_rent_current",
  "annual_rent_current",
  "occupancy_rate",
  "operating_expense_monthly",
  "repair_reserve_annual",
  "fixed_asset_tax_annual",
  "insurance_annual",
  "notes"
] as const;
const LINE_CANDIDATE_KEYS = [
  "period",
  "transaction_date",
  "unit_name",
  "category",
  "description",
  "amount",
  "source_sheet",
  "confidence",
  "notes"
] as const;
const FORBIDDEN_UNIT_KEYS = [
  "unit_number",
  "monthly_rent",
  "tenant_name",
  "other_income",
  "total_income",
  "lease_start_date",
  "lease_end_date"
];
const NUMERIC_CANDIDATE_KEYS = new Set([
  "asking_price",
  "gross_yield_full",
  "current_yield",
  "monthly_rent_full",
  "annual_rent_full",
  "monthly_rent_current",
  "annual_rent_current",
  "built_year",
  "building_age",
  "land_area",
  "building_area",
  "total_units",
  "walk_minutes",
  "floor_area",
  "rent_current",
  "common_fee",
  "parking_fee",
  "other_fee",
  "total_monthly_rent",
  "purchase_price",
  "occupancy_rate",
  "operating_expense_monthly",
  "repair_reserve_annual",
  "fixed_asset_tax_annual",
  "insurance_annual",
  "amount",
  "confidence"
]);

const EMPTY_AI_DRAFT = {
  deal_candidate: {
    property_name: null,
    address: null,
    asking_price: null,
    gross_yield_full: null,
    current_yield: null,
    monthly_rent_full: null,
    annual_rent_full: null,
    monthly_rent_current: null,
    annual_rent_current: null,
    property_type: null,
    structure: null,
    built_year: null,
    building_age: null,
    land_area: null,
    building_area: null,
    total_units: null,
    nearest_station: null,
    walk_minutes: null,
    broker_name: null,
    memo: null
  },
  deal_units_candidate: [],
  simulation_candidate: {
    purchase_price: null,
    monthly_rent_full: null,
    annual_rent_full: null,
    monthly_rent_current: null,
    annual_rent_current: null,
    occupancy_rate: null,
    operating_expense_monthly: null,
    repair_reserve_annual: null,
    fixed_asset_tax_annual: null,
    insurance_annual: null,
    notes: null
  },
  income_statement_candidate: {
    period_summary: [],
    income_lines: [],
    expense_lines: [],
    transfer_amounts: [],
    detected_periods: [],
    notes: null
  },
  extraction_metadata: {
    source_file_id: null,
    parser_type: null,
    model: null,
    extracted_at: null,
    confidence_score: null,
    input_char_count: null,
    warnings_count: null
  },
  warnings: []
};

export function canExtractAiDraft(sourceFile: SourceFileRow) {
  return (
    ["parsed", "extracted"].includes(sourceFile.processing_status) &&
    Boolean(sourceFile.extracted_text || sourceFile.extracted_json)
  );
}

export async function generateDealAiDraft(sourceFile: SourceFileRow) {
  if (!canExtractAiDraft(sourceFile)) {
    throw new Error("Process this file first before generating an AI draft.");
  }

  const parserResult = getParserResult(sourceFile.extracted_json);
  const parserType = getParserType(parserResult);
  const extractedText = truncateText(
    sourceFile.extracted_text ?? "",
    MAX_EXTRACT_TEXT_CHARS
  );
  const parserJsonText = JSON.stringify(parserResult ?? {}, null, 2);
  const extractedJsonText = truncateText(
    parserJsonText,
    MAX_EXTRACT_JSON_CHARS
  );
  const inputCharCount = extractedText.length + extractedJsonText.length;
  const extractedAt = new Date().toISOString();
  const model = getOpenAiModel();
  const inputWasTruncated =
    (sourceFile.extracted_text?.length ?? 0) > extractedText.length ||
    parserJsonText.length > extractedJsonText.length;
  const aiDraft = normalizeAiDraft(
    await generateOpenAiJson({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt({
        sourceFile,
        parserType,
        extractedText,
        extractedJsonText,
        inputWasTruncated
      })
    }),
    {
      sourceFileId: sourceFile.id,
      parserType,
      model,
      extractedAt,
      inputCharCount,
      inputWasTruncated,
      parserResult
    }
  );

  return mergeAiDraftIntoExtractedJson({
    existingExtractedJson: sourceFile.extracted_json,
    aiDraft,
    extractedAt,
    model
  });
}

function buildSystemPrompt() {
  return [
    "You extract structured due-diligence draft JSON from Japanese real estate source files.",
    "Return JSON only. Do not include markdown.",
    "Do not guess. Use null for uncertain values.",
    "Preserve ambiguity as warnings.",
    "Do not create final business records. This is draft-only data for human review."
  ].join("\n");
}

function buildUserPrompt({
  sourceFile,
  parserType,
  extractedText,
  extractedJsonText,
  inputWasTruncated
}: {
  sourceFile: SourceFileRow;
  parserType: string | null;
  extractedText: string;
  extractedJsonText: string;
  inputWasTruncated: boolean;
}) {
  return [
    "Create a semantic draft JSON candidate for a deal source file.",
    "Required top-level keys:",
    JSON.stringify(EMPTY_AI_DRAFT, null, 2),
    "",
    "Field rules:",
    "- Numbers must be numeric, not formatted strings.",
    "- Japanese yen amounts should be plain numbers.",
    "- Percentages should be numeric percentage points, e.g. 7.5 for 7.5%.",
    "- Use null for uncertain values.",
    "- For deal_units_candidate, use only these keys:",
    DEAL_UNIT_KEYS.join(", "),
    "- Do not return these keys anywhere in deal_units_candidate:",
    FORBIDDEN_UNIT_KEYS.join(", "),
    "- Map unit_number to unit_name.",
    "- Map monthly_rent to rent_current.",
    "- Map other_income to other_fee.",
    "- Map total_income to total_monthly_rent.",
    "- Mask tenant names in tenant_name_masked. Never return raw tenant_name.",
    "- Include warnings for ambiguous headers, inferred values, unclear periods, or truncation.",
    "",
    "Source file metadata:",
    JSON.stringify(
      {
        source_file_id: sourceFile.id,
        file_name: sourceFile.file_name,
        document_type: sourceFile.document_type,
        file_type: sourceFile.file_type,
        parser_type: parserType,
        input_was_truncated: inputWasTruncated
      },
      null,
      2
    ),
    "",
    "Extracted text:",
    extractedText || "(none)",
    "",
    "Extracted JSON:",
    extractedJsonText || "{}"
  ].join("\n");
}

function normalizeAiDraft(
  rawDraft: Record<string, unknown>,
  metadata: {
    sourceFileId: string;
    parserType: string | null;
    model: string;
    extractedAt: string;
    inputCharCount: number;
    inputWasTruncated: boolean;
    parserResult: Json | null;
  }
) {
  const normalized = normalizeAiDraftShape(rawDraft, metadata);
  const validation = validateAiDraftShape(normalized);
  const warnings = [
    ...normalized.warnings,
    ...validation.warnings
  ].filter((warning, index, allWarnings) => allWarnings.indexOf(warning) === index);

  return {
    ...normalized,
    warnings,
    extraction_metadata: {
      source_file_id: metadata.sourceFileId,
      parser_type: metadata.parserType,
      model: metadata.model,
      extracted_at: metadata.extractedAt,
      input_char_count: metadata.inputCharCount,
      warnings_count: warnings.length
    }
  } as Json;
}

export function validateAiDraftShape(value: unknown): AiDraftValidationResult {
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      warnings: ["AI draft is not an object."]
    };
  }

  const expectedTopLevelKeys = Object.keys(EMPTY_AI_DRAFT);
  const actualTopLevelKeys = Object.keys(value);
  const extraTopLevelKeys = actualTopLevelKeys.filter(
    (key) => !expectedTopLevelKeys.includes(key)
  );

  if (extraTopLevelKeys.length > 0) {
    warnings.push(`Unexpected top-level keys were removed: ${extraTopLevelKeys.join(", ")}`);
  }

  const units = Array.isArray(value.deal_units_candidate)
    ? value.deal_units_candidate
    : [];

  units.forEach((unit, index) => {
    if (!isRecord(unit)) {
      warnings.push(`deal_units_candidate[${index}] is not an object.`);
      return;
    }

    const forbiddenKeys = FORBIDDEN_UNIT_KEYS.filter((key) => key in unit);

    if (forbiddenKeys.length > 0) {
      warnings.push(
        `Forbidden unit keys were removed from row ${index + 1}: ${forbiddenKeys.join(", ")}`
      );
    }
  });

  return {
    valid: warnings.length === 0,
    warnings
  };
}

export function normalizeAiDraftShape(
  rawDraft: Record<string, unknown>,
  metadata: {
    sourceFileId: string;
    parserType: string | null;
    model: string;
    extractedAt: string;
    inputCharCount: number;
    inputWasTruncated: boolean;
    parserResult: Json | null;
  }
) {
  const warnings = collectInitialWarnings(rawDraft, metadata);

  return {
    deal_candidate: normalizeKeyedObject(
      isRecord(rawDraft.deal_candidate) ? rawDraft.deal_candidate : {},
      DEAL_CANDIDATE_KEYS
    ),
    deal_units_candidate: normalizeDealUnitsCandidate(
      rawDraft.deal_units_candidate,
      warnings
    ),
    simulation_candidate: normalizeKeyedObject(
      isRecord(rawDraft.simulation_candidate)
        ? rawDraft.simulation_candidate
        : {},
      SIMULATION_CANDIDATE_KEYS
    ),
    income_statement_candidate: normalizeIncomeStatementCandidate(
      rawDraft.income_statement_candidate,
      warnings,
      metadata
    ),
    extraction_metadata: {
      source_file_id: metadata.sourceFileId,
      parser_type: metadata.parserType,
      model: metadata.model,
      extracted_at: metadata.extractedAt,
      confidence_score: getNullableNumber(
        isRecord(rawDraft.extraction_metadata)
          ? rawDraft.extraction_metadata.confidence_score
          : null
      ),
      input_char_count: metadata.inputCharCount,
      warnings_count: warnings.length
    },
    warnings
  };
}

function normalizeDealUnitsCandidate(value: unknown, warnings: string[]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((unit, index) => normalizeDealUnitCandidate(unit, index, warnings))
    .filter((unit): unit is Record<(typeof DEAL_UNIT_KEYS)[number], unknown> =>
      Boolean(unit)
    );
}

function normalizeDealUnitCandidate(
  value: unknown,
  index: number,
  warnings: string[]
) {
  if (!isRecord(value)) {
    warnings.push(`Skipped deal unit row ${index + 1}: row was not an object.`);
    return null;
  }

  const mapped = {
    ...value,
    unit_name: value.unit_name ?? value.unit_number,
    rent_current: value.rent_current ?? value.monthly_rent,
    other_fee: value.other_fee ?? value.other_income,
    total_monthly_rent: value.total_monthly_rent ?? value.total_income
  };
  const forbiddenKeys = FORBIDDEN_UNIT_KEYS.filter((key) => key in value);

  if (forbiddenKeys.length > 0) {
    warnings.push(
      `Forbidden unit keys were normalized or removed from row ${index + 1}: ${forbiddenKeys.join(", ")}.`
    );
  }

  const normalized = normalizeKeyedObject(mapped, DEAL_UNIT_KEYS);
  const tenantSource = value.tenant_name_masked ?? value.tenant_name;

  if (tenantSource !== null && tenantSource !== undefined && tenantSource !== "") {
    const maskedTenantName = maskTenantName(String(tenantSource));

    if (maskedTenantName) {
      normalized.tenant_name_masked = maskedTenantName;
      warnings.push(`Tenant name was masked for unit row ${index + 1}.`);
    } else {
      normalized.tenant_name_masked = null;
      warnings.push(
        `Tenant name masking was uncertain for unit row ${index + 1}; tenant_name_masked was set to null.`
      );
    }
  }

  normalized.total_monthly_rent = normalizeTotalMonthlyRent(normalized, index, warnings);

  return normalized;
}

function normalizeTotalMonthlyRent(
  unit: Record<string, unknown>,
  index: number,
  warnings: string[]
) {
  const explicitTotal = getNullableNumber(unit.total_monthly_rent);

  if (explicitTotal !== null) {
    return explicitTotal;
  }

  const rentCurrent = getNullableNumber(unit.rent_current);
  const feeValues: Array<number | null> = [
    getNullableNumber(unit.common_fee),
    getNullableNumber(unit.parking_fee),
    getNullableNumber(unit.other_fee)
  ];

  if (rentCurrent === null) {
    warnings.push(`total_monthly_rent is uncertain for unit row ${index + 1}.`);
    return null;
  }

  const feeTotal = feeValues.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  );

  return rentCurrent + feeTotal;
}

function normalizeIncomeStatementCandidate(
  value: unknown,
  warnings: string[],
  metadata: { inputWasTruncated: boolean }
) {
  const source = isRecord(value) ? value : {};
  const incomeStatement = {
    period_summary: Array.isArray(source.period_summary) ? source.period_summary : [],
    income_lines: normalizeLineCandidates(source.income_lines),
    expense_lines: normalizeLineCandidates(source.expense_lines),
    transfer_amounts: Array.isArray(source.transfer_amounts)
      ? source.transfer_amounts
      : [],
    detected_periods: Array.isArray(source.detected_periods)
      ? source.detected_periods
      : [],
    notes: getNullableString(source.notes)
  };

  if (
    metadata.inputWasTruncated &&
    incomeStatement.period_summary.length === 0 &&
    incomeStatement.income_lines.length === 0 &&
    incomeStatement.expense_lines.length === 0
  ) {
    warnings.push("income_statement_candidate is empty and input was truncated.");
  }

  return incomeStatement;
}

function normalizeLineCandidates(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((line) => normalizeKeyedObject(line, LINE_CANDIDATE_KEYS));
}

function normalizeKeyedObject<const T extends readonly string[]>(
  source: Record<string, unknown>,
  keys: T
) {
  return Object.fromEntries(
    keys.map((key) => [key, normalizeCandidateValue(key, source[key])])
  ) as Record<T[number], unknown>;
}

function normalizeCandidateValue(key: string, value: unknown) {
  if (value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const numberValue = NUMERIC_CANDIDATE_KEYS.has(key)
      ? parseLooseNumber(value)
      : null;

    return numberValue ?? value.trim();
  }

  return value ?? null;
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function getNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    return parseLooseNumber(value);
  }

  return null;
}

function parseLooseNumber(value: string) {
  const normalized = value
    .replace(/[,\s]/g, "")
    .replace(/\u00a5/g, "")
    .replace(/\uffe5/g, "")
    .replace(/\u5186/g, "")
    .replace(/%$/, "");

  if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const numberValue = Number(normalized);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function maskTenantName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  if (/[*\uff0a]/.test(normalized) && !/\s/.test(normalized)) {
    return normalized;
  }

  const [familyName] = normalized.split(/[\s\u3000]+/).filter(Boolean);

  if (!familyName || familyName === normalized) {
    return null;
  }

  return `${familyName}\uff0a\uff0a`;
}

function collectInitialWarnings(
  rawDraft: Record<string, unknown>,
  metadata: {
    inputWasTruncated: boolean;
    parserResult: Json | null;
  }
) {
  const warnings = Array.isArray(rawDraft.warnings)
    ? rawDraft.warnings.map(String)
    : [];

  if (metadata.inputWasTruncated) {
    warnings.push("Input was truncated before AI extraction.");
  }

  if (hasParserWarnings(metadata.parserResult)) {
    warnings.push("Parser warnings or ambiguous headers were present in parser_result.");
  }

  return warnings;
}

function hasParserWarnings(value: Json | null) {
  if (!isRecord(value)) {
    return false;
  }

  if (
    Array.isArray(value.parser_warnings) &&
    value.parser_warnings.length > 0
  ) {
    return true;
  }

  if (Array.isArray(value.sheets)) {
    return value.sheets.some(
      (sheet) => isRecord(sheet) && Array.isArray(sheet.warnings) && sheet.warnings.length > 0
    );
  }

  return false;
}

function mergeAiDraftIntoExtractedJson({
  existingExtractedJson,
  aiDraft,
  extractedAt,
  model
}: {
  existingExtractedJson: Json | undefined | null;
  aiDraft: Json;
  extractedAt: string;
  model: string;
}) {
  const envelope = toExtractedJsonEnvelope(existingExtractedJson);
  const history = Array.isArray(envelope.extraction_history)
    ? envelope.extraction_history
    : [];

  return {
    parser_result: envelope.parser_result,
    ai_draft: aiDraft,
    extraction_history: [
      ...history,
      {
        extracted_at: extractedAt,
        model,
        action: "generate_ai_draft"
      }
    ]
  } satisfies ExtractedJsonEnvelope;
}

function toExtractedJsonEnvelope(value: Json | undefined | null): ExtractedJsonEnvelope {
  if (
    isRecord(value) &&
    "parser_result" in value &&
    "ai_draft" in value
  ) {
    return {
      parser_result: value.parser_result as Json,
      ai_draft: value.ai_draft as Json,
      extraction_history: Array.isArray(value.extraction_history)
        ? (value.extraction_history as Json[])
        : []
    };
  }

  return {
    parser_result: (value ?? null) as Json,
    extraction_history: []
  };
}

function getParserResult(value: Json | undefined | null) {
  if (isRecord(value) && "parser_result" in value) {
    return value.parser_result as Json;
  }

  return value ?? null;
}

function getParserType(value: Json | undefined | null) {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.parser_type === "string") {
    return value.parser_type;
  }

  if (isRecord(value.parser) && typeof value.parser.type === "string") {
    return value.parser.type;
  }

  return null;
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n[TRUNCATED ${value.length - maxChars} chars]`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
