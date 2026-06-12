export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatJpy(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value;

  return `${new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1
  }).format(normalized)}%`;
}

export function formatRatio(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}x`;
}

export function formatOccupancyFromVacancy(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalizedVacancy = Math.abs(value) <= 1 ? value * 100 : value;

  return formatPercent(100 - normalizedVacancy);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}
