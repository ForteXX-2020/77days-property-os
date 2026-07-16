import { generateOpenAiJson, getOpenAiModel } from "@/lib/openaiServer";
import type { Json, SourceFileRow } from "@/types/supabase";

type ExtractedJsonEnvelope = {
  parser_result: Json;
  ai_draft?: Json;
  extraction_history?: Json[];
};

const MAX_EXTRACT_TEXT_CHARS = 24000;
const MAX_EXTRACT_JSON_CHARS = 24000;

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
  const extractedJsonText = truncateText(
    JSON.stringify(parserResult ?? {}, null, 2),
    MAX_EXTRACT_JSON_CHARS
  );
  const inputCharCount = extractedText.length + extractedJsonText.length;
  const extractedAt = new Date().toISOString();
  const model = getOpenAiModel();
  const aiDraft = normalizeAiDraft(
    await generateOpenAiJson({
      systemPrompt: buildSystemPrompt(),
      userPrompt: buildUserPrompt({
        sourceFile,
        parserType,
        extractedText,
        extractedJsonText,
        inputWasTruncated:
          (sourceFile.extracted_text?.length ?? 0) > extractedText.length ||
          JSON.stringify(parserResult ?? {}, null, 2).length > extractedJsonText.length
      })
    }),
    {
      sourceFileId: sourceFile.id,
      parserType,
      model,
      extractedAt,
      inputCharCount
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
    "- Mask tenant names if present.",
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
  }
) {
  const draft = {
    ...EMPTY_AI_DRAFT,
    ...rawDraft,
    deal_candidate: {
      ...EMPTY_AI_DRAFT.deal_candidate,
      ...(isRecord(rawDraft.deal_candidate) ? rawDraft.deal_candidate : {})
    },
    simulation_candidate: {
      ...EMPTY_AI_DRAFT.simulation_candidate,
      ...(isRecord(rawDraft.simulation_candidate)
        ? rawDraft.simulation_candidate
        : {})
    },
    income_statement_candidate: {
      ...EMPTY_AI_DRAFT.income_statement_candidate,
      ...(isRecord(rawDraft.income_statement_candidate)
        ? rawDraft.income_statement_candidate
        : {})
    },
    deal_units_candidate: Array.isArray(rawDraft.deal_units_candidate)
      ? rawDraft.deal_units_candidate
      : [],
    warnings: Array.isArray(rawDraft.warnings) ? rawDraft.warnings : []
  };
  const warnings = Array.isArray(draft.warnings) ? draft.warnings : [];

  return {
    ...draft,
    extraction_metadata: {
      ...(isRecord(draft.extraction_metadata) ? draft.extraction_metadata : {}),
      source_file_id: metadata.sourceFileId,
      parser_type: metadata.parserType,
      model: metadata.model,
      extracted_at: metadata.extractedAt,
      input_char_count: metadata.inputCharCount,
      warnings_count: warnings.length
    }
  } as Json;
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
