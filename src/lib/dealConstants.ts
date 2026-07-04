export const PROPERTY_TYPE_OPTIONS = [
  "1棟マンション",
  "1棟アパート",
  "戸建賃貸",
  "倉庫",
  "駐車場",
  "区分マンション",
  "区分事務所",
  "1棟商業ビル",
  "賃貸併用住宅",
  "工場",
  "ホテル",
  "区分店舗",
  "土地"
] as const;

export const DEAL_STATUS_OPTIONS = [
  "sourced",
  "reviewing",
  "paused",
  "closed"
] as const;

export const FINAL_DECISION_OPTIONS = [
  "undecided",
  "pursue",
  "pass",
  "hold"
] as const;

export const SOURCE_FILE_DOCUMENT_TYPE_OPTIONS = [
  "sales_sheet",
  "rent_roll",
  "income_statement",
  "registry",
  "photos",
  "repair_report",
  "other"
] as const;

export type SourceFileDocumentType =
  (typeof SOURCE_FILE_DOCUMENT_TYPE_OPTIONS)[number];

export const SOURCE_FILE_DOCUMENT_TYPE_LABELS: Record<
  SourceFileDocumentType,
  string
> = {
  sales_sheet: "販売図面",
  rent_roll: "レントロール",
  income_statement: "収支表",
  registry: "登記",
  photos: "写真",
  repair_report: "修繕報告",
  other: "その他"
};
