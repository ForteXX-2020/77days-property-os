import { inflateRawSync, inflateSync } from "node:zlib";
import type { Json, SourceFileRow } from "@/types/supabase";

type ParsedSourceFileResult = {
  extractedText: string;
  extractedJson: Json;
  pageCount?: number | null;
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type XlsxSheetParseResult = {
  sheet_name: string;
  headers: string[];
  rows: Array<Record<string, string | string[]>>;
  row_count: number;
  raw_row_count: number;
  detected_header_row_index: number | null;
  warnings: string[];
};

const TEXT_DECODER = new TextDecoder("utf-8");
const MAX_TEXT_ROWS = 50;
const MAX_JSON_ROWS = 1000;

export function getSourceFileParserKind(sourceFile: SourceFileRow) {
  const fileName = sourceFile.file_name.toLowerCase();
  const fileType = sourceFile.file_type?.toLowerCase() ?? "";

  if (fileType.includes("csv") || fileName.endsWith(".csv")) {
    return "csv";
  }

  if (
    fileType.includes("spreadsheetml") ||
    fileType.includes("excel") ||
    fileName.endsWith(".xlsx")
  ) {
    return "xlsx";
  }

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  return null;
}

export function isSourceFileParserSupported(sourceFile: SourceFileRow) {
  return getSourceFileParserKind(sourceFile) !== null;
}

export function getSourceFileUnsupportedReason(sourceFile: SourceFileRow) {
  if (sourceFile.file_type?.startsWith("image/")) {
    return "Image OCR is not implemented yet.";
  }

  return "Parser supports CSV, XLSX, and text PDF files only.";
}

export function parseSourceFileBytes(
  sourceFile: SourceFileRow,
  bytes: Uint8Array
): ParsedSourceFileResult {
  const parserKind = getSourceFileParserKind(sourceFile);

  if (parserKind === "csv") {
    return parseCsv(bytes, sourceFile);
  }

  if (parserKind === "xlsx") {
    return parseXlsx(bytes, sourceFile);
  }

  if (parserKind === "pdf") {
    return parsePdf(bytes, sourceFile);
  }

  throw new Error(getSourceFileUnsupportedReason(sourceFile));
}

function decodeUtf8(bytes: Uint8Array) {
  return TEXT_DECODER.decode(bytes).replace(/^\uFEFF/, "");
}

function parseCsv(bytes: Uint8Array, sourceFile: SourceFileRow) {
  const text = decodeUtf8(bytes);
  const rows = parseCsvRows(text);
  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const safeHeaders = makeUniqueHeaders(headers, Math.max(headers.length, getMaxRowLength(dataRows)));
  const objectRows = dataRows
    .slice(0, MAX_JSON_ROWS)
    .map((row) => buildRowObject(safeHeaders, row));
  const extractedText = [
    `CSV: ${sourceFile.file_name}`,
    `Rows: ${dataRows.length}`,
    safeHeaders.length > 0 ? `Headers: ${safeHeaders.join(", ")}` : "Headers: -",
    "",
    ...rows.slice(0, MAX_TEXT_ROWS + 1).map((row) => row.join(" | "))
  ].join("\n");

  return {
    extractedText,
    extractedJson: {
      parser: {
        type: "csv",
        version: "0.1",
        generated_at: new Date().toISOString()
      },
      headers: safeHeaders,
      rows: objectRows,
      row_count: dataRows.length
    }
  };
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => value.trim() !== ""));
}

function parseXlsx(bytes: Uint8Array, sourceFile: SourceFileRow) {
  const entries = readZipEntries(Buffer.from(bytes));
  const sharedStrings = parseSharedStrings(getZipText(entries, "xl/sharedStrings.xml") ?? "");
  const sheetNameMap = parseWorkbookSheetMap(
    getZipText(entries, "xl/workbook.xml") ?? "",
    getZipText(entries, "xl/_rels/workbook.xml.rels") ?? ""
  );
  const worksheetNames = Object.keys(entries)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort();
  const sheets = worksheetNames.map((entryName) => {
    const xml = getZipText(entries, entryName) ?? "";
    const rawRows = parseWorksheetRows(xml, sharedStrings);

    return parseXlsxSheet(
      sheetNameMap[entryName] ?? entryName.replace(/^xl\/worksheets\//, ""),
      rawRows
    );
  });
  const parserWarnings = sheets.flatMap((sheet) =>
    sheet.warnings.map((warning) => `${sheet.sheet_name}: ${warning}`)
  );
  const extractedText = [
    `XLSX: ${sourceFile.file_name}`,
    `Sheets: ${sheets.map((sheet) => sheet.sheet_name).join(", ") || "-"}`,
    parserWarnings.length > 0 ? `Warnings: ${parserWarnings.join(" / ")}` : null,
    "",
    ...sheets.flatMap((sheet) => [
      `# ${sheet.sheet_name}`,
      `Rows: ${sheet.row_count}`,
      `Raw rows: ${sheet.raw_row_count}`,
      sheet.detected_header_row_index === null
        ? "Header row: generated fallback headers"
        : `Header row: ${sheet.detected_header_row_index + 1}`,
      sheet.headers.length > 0 ? `Headers: ${sheet.headers.join(", ")}` : "Headers: -",
      ...sheet.rows.slice(0, MAX_TEXT_ROWS).map((row) =>
        sheet.headers.map((header) => `${header}: ${String(row[header] ?? "")}`).join(" | ")
      ),
      ""
    ].filter((line): line is string => line !== null))
  ].join("\n");

  return {
    extractedText,
    extractedJson: {
      parser_type: "xlsx",
      parser: {
        type: "xlsx",
        version: "0.1",
        generated_at: new Date().toISOString()
      },
      sheets,
      row_count: sheets.reduce((sum, sheet) => sum + sheet.row_count, 0),
      parser_warnings: parserWarnings
    }
  };
}

function parseXlsxSheet(sheetName: string, rawRows: string[][]): XlsxSheetParseResult {
  const normalizedRows = normalizeRows(rawRows);
  const rawRowCount = rawRows.length;
  const skippedBlankRows = rawRowCount - normalizedRows.length;
  const warnings: string[] = [];
  const maxColumnCount = Math.max(getMaxRowLength(normalizedRows), 1);
  const headerRowIndex = detectHeaderRowIndex(normalizedRows);
  const generatedHeaders = headerRowIndex === null;
  const headerSource = generatedHeaders
    ? Array.from({ length: maxColumnCount }, (_value, index) => `column_${index + 1}`)
    : normalizedRows[headerRowIndex];
  const headers = makeUniqueHeaders(headerSource, maxColumnCount);
  const dataRows = generatedHeaders
    ? normalizedRows
    : normalizedRows.slice(headerRowIndex + 1);
  const objectRows = dataRows
    .slice(0, MAX_JSON_ROWS)
    .map((row) => buildRowObject(headers, row));

  if (skippedBlankRows > 0) {
    warnings.push(`${skippedBlankRows} blank row(s) skipped.`);
  }

  if (generatedHeaders) {
    warnings.push("No reliable header row detected; fallback headers generated.");
  }

  if (headers.some((header) => /_\d+$/.test(header))) {
    warnings.push("Blank or duplicate headers were normalized.");
  }

  return {
    sheet_name: sheetName,
    headers,
    rows: objectRows,
    row_count: dataRows.length,
    raw_row_count: rawRowCount,
    detected_header_row_index: headerRowIndex,
    warnings
  };
}

function normalizeRows(rows: string[][]) {
  return rows
    .map((row) => normalizeRow(row))
    .filter((row) => !isBlankRow(row));
}

function normalizeRow(row: Array<string | number | boolean | null | undefined>) {
  const normalizedLength = row.length;

  return Array.from({ length: normalizedLength }, (_value, index) =>
    normalizeCellValue(row[index])
  );
}

function normalizeCellValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isBlankRow(row: string[]) {
  return row.every((cell) => cell.trim() === "");
}

function getMaxRowLength(rows: string[][]) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function detectHeaderRowIndex(rows: string[][]) {
  const candidates = rows.slice(0, 20);
  let bestIndex: number | null = null;
  let bestScore = 0;

  candidates.forEach((row, index) => {
    const nonBlankCells = row.filter((cell) => cell.trim() !== "");
    const uniqueCells = new Set(nonBlankCells.map((cell) => cell.toLowerCase()));
    const numericLikeCells = nonBlankCells.filter((cell) => isNumericLike(cell));

    if (nonBlankCells.length < 2) {
      return;
    }

    const score =
      nonBlankCells.length +
      uniqueCells.size * 0.75 -
      numericLikeCells.length * 1.5 -
      index * 0.05;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore > 2 ? bestIndex : null;
}

function isNumericLike(value: string) {
  return /^[-+]?[\d,]+(?:\.\d+)?%?$/.test(value.trim());
}

function makeUniqueHeaders(sourceHeaders: string[], minColumnCount: number) {
  const columnCount = Math.max(sourceHeaders.length, minColumnCount);
  const seen = new Map<string, number>();
  const headers: string[] = [];

  for (let index = 0; index < columnCount; index += 1) {
    const rawHeader = normalizeHeader(sourceHeaders[index], index);
    const seenCount = seen.get(rawHeader) ?? 0;
    const uniqueHeader = seenCount === 0 ? rawHeader : `${rawHeader}_${seenCount + 1}`;

    seen.set(rawHeader, seenCount + 1);
    headers.push(uniqueHeader);
  }

  return headers;
}

function normalizeHeader(value: string | null | undefined, index: number) {
  const header = normalizeCellValue(value).replace(/\s+/g, "_");

  return header || `column_${index + 1}`;
}

function buildRowObject(headers: string[], row: string[]) {
  const rowObject: Record<string, string | string[]> = {};

  headers.forEach((header, index) => {
    rowObject[header] = normalizeCellValue(row[index]);
  });

  rowObject.raw_values = headers.map((_header, index) => normalizeCellValue(row[index]));

  return rowObject;
}

function readZipEntries(buffer: Buffer) {
  const entries: Record<string, Buffer> = {};
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const endOffset = centralDirectoryOffset + centralDirectorySize;

  while (offset < endOffset) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid XLSX central directory.");
    }

    const entry: ZipEntry = {
      compressionMethod: buffer.readUInt16LE(offset + 10),
      compressedSize: buffer.readUInt32LE(offset + 20),
      localHeaderOffset: buffer.readUInt32LE(offset + 42),
      name: buffer
        .subarray(offset + 46, offset + 46 + buffer.readUInt16LE(offset + 28))
        .toString("utf8")
    };
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    entries[entry.name] = extractZipEntry(buffer, entry);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("Invalid XLSX file.");
}

function extractZipEntry(buffer: Buffer, entry: ZipEntry) {
  const offset = entry.localHeaderOffset;

  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`Invalid XLSX local file header: ${entry.name}`);
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed);
  }

  throw new Error(`Unsupported XLSX compression method: ${entry.compressionMethod}`);
}

function getZipText(entries: Record<string, Buffer>, name: string) {
  const entry = entries[name];
  return entry ? entry.toString("utf8") : null;
}

function parseSharedStrings(xml: string) {
  return Array.from(xml.matchAll(/<si[\s\S]*?<\/si>/g)).map((match) =>
    decodeXmlText(
      Array.from(match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g))
        .map((textMatch) => textMatch[1])
        .join("")
    )
  );
}

function parseWorkbookSheetMap(workbookXml: string, relsXml: string) {
  const rels: Record<string, string> = {};

  for (const match of Array.from(
    relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)
  )) {
    rels[match[1]] = `xl/${match[2].replace(/^\//, "")}`.replace(
      "xl/worksheets",
      "xl/worksheets"
    );
  }

  const sheetMap: Record<string, string> = {};

  for (const match of Array.from(
    workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*(?:r:id|id)="([^"]+)"/g)
  )) {
    sheetMap[rels[match[2]] ?? match[2]] = decodeXmlText(match[1]);
  }

  return sheetMap;
}

function parseWorksheetRows(xml: string, sharedStrings: string[]) {
  return Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)).map((rowMatch) => {
    const cells: string[] = [];

    for (const cellMatch of Array.from(
      rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)
    )) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const columnIndex = ref ? columnLettersToIndex(ref) : cells.length;
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const value = parseCellValue(body, type, sharedStrings);
      cells[columnIndex] = value;
    }

    return cells.map((cell) => cell ?? "");
  });
}

function parseCellValue(body: string, type: string | undefined, sharedStrings: string[]) {
  if (type === "inlineStr") {
    return decodeXmlText(
      Array.from(body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g))
        .map((match) => match[1])
        .join("")
    );
  }

  const rawValue = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";

  if (type === "s") {
    return sharedStrings[Number(rawValue)] ?? "";
  }

  return decodeXmlText(rawValue);
}

function columnLettersToIndex(column: string) {
  return column
    .split("")
    .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parsePdf(bytes: Uint8Array, sourceFile: SourceFileRow) {
  const buffer = Buffer.from(bytes);
  const latinText = buffer.toString("latin1");
  const pageCount = (latinText.match(/\/Type\s*\/Page\b/g) ?? []).length || null;
  const streamTexts = extractPdfStreams(buffer)
    .flatMap((stream) => extractPdfTextFromStream(stream))
    .map((text) => text.trim())
    .filter(Boolean);
  const extractedText = streamTexts.join("\n").trim();

  if (!extractedText) {
    throw new Error("No embedded PDF text found. Scanned PDF OCR is not implemented yet.");
  }

  return {
    extractedText,
    pageCount,
    extractedJson: {
      parser: {
        type: "pdf_text",
        version: "0.1",
        generated_at: new Date().toISOString(),
        ocr: false
      },
      text: extractedText,
      page_count: pageCount,
      file_name: sourceFile.file_name
    }
  };
}

function extractPdfStreams(buffer: Buffer) {
  const streams: Buffer[] = [];
  const source = buffer.toString("latin1");
  const regex = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source))) {
    const dictionary = match[1];
    const rawStream = Buffer.from(match[2], "latin1");

    try {
      if (/\/FlateDecode/.test(dictionary)) {
        streams.push(inflateSync(rawStream));
      } else {
        streams.push(rawStream);
      }
    } catch {
      // Ignore unreadable streams. The parser is best-effort text extraction only.
    }
  }

  return streams;
}

function extractPdfTextFromStream(stream: Buffer) {
  const source = stream.toString("latin1");
  const textChunks: string[] = [];

  for (const match of Array.from(
    source.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)
  )) {
    textChunks.push(decodePdfLiteralString(match[0].replace(/\s*Tj$/, "")));
  }

  for (const match of Array.from(source.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g))) {
    textChunks.push(decodePdfHexString(match[1]));
  }

  for (const match of Array.from(source.matchAll(/\[(.*?)\]\s*TJ/g))) {
    const literalParts = Array.from(
      match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)
    ).map((part) => decodePdfLiteralString(part[0]));
    const hexParts = Array.from(match[1].matchAll(/<([0-9A-Fa-f\s]+)>/g)).map(
      (part) => decodePdfHexString(part[1])
    );
    const parts = [...literalParts, ...hexParts];
    textChunks.push(parts.join(""));
  }

  return textChunks;
}

function decodePdfLiteralString(value: string) {
  const inner = value.slice(1, -1);

  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8))
    );
}

function decodePdfHexString(value: string) {
  const hex = value.replace(/\s/g, "");
  const bytes = Buffer.from(hex.length % 2 === 0 ? hex : `${hex}0`, "hex");

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const chars: string[] = [];

    for (let index = 2; index + 1 < bytes.length; index += 2) {
      chars.push(String.fromCharCode(bytes.readUInt16BE(index)));
    }

    return chars.join("");
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    const chars: string[] = [];

    for (let index = 2; index + 1 < bytes.length; index += 2) {
      chars.push(String.fromCharCode(bytes.readUInt16LE(index)));
    }

    return chars.join("");
  }

  return bytes.toString("utf8");
}
