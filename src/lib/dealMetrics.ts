export type DealMetricInputs = {
  asking_price: number | null;
  monthly_rent_full: number | null;
  annual_rent_full: number | null;
  monthly_rent_current: number | null;
  annual_rent_current: number | null;
  gross_yield_full: number | null;
  current_yield: number | null;
};

export type DealMetricValues = DealMetricInputs & {
  calculated_gross_yield_full: number | null;
  calculated_current_yield: number | null;
};

export type DealMetricValidation = {
  errors: string[];
  warnings: string[];
};

const ANNUAL_RENT_TOLERANCE = 1;
const YIELD_TOLERANCE = 0.05;

export function parseDealNumberInput(value: FormDataEntryValue | string | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    return {
      value: null,
      error: null
    };
  }

  const normalized = value.trim().replace(/,/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return {
      value: null,
      error: `${label} must be a valid number.`
    };
  }

  if (parsed < 0) {
    return {
      value: null,
      error: `${label} must not be negative.`
    };
  }

  return {
    value: parsed,
    error: null
  };
}

export function calculateAnnualRentFromMonthly(monthlyRent: number) {
  return monthlyRent * 12;
}

export function calculateMonthlyRentFromAnnual(annualRent: number) {
  return annualRent / 12;
}

export function calculateGrossYield(
  askingPrice: number | null | undefined,
  annualRent: number | null | undefined
) {
  if (!askingPrice || askingPrice <= 0 || annualRent === null || annualRent === undefined) {
    return null;
  }

  return (annualRent / askingPrice) * 100;
}

export function roundGrossYield(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateAnnualRentFromYield(
  askingPrice: number | null,
  listingYield: number | null
) {
  if (askingPrice === null || askingPrice <= 0 || listingYield === null) {
    return null;
  }

  return roundMoney((askingPrice * listingYield) / 100);
}

function fillRentPairFromYield(
  values: DealMetricValues,
  annualKey: "annual_rent_full" | "annual_rent_current",
  monthlyKey: "monthly_rent_full" | "monthly_rent_current",
  yieldKey: "gross_yield_full" | "current_yield"
) {
  if (values[annualKey] !== null || values[monthlyKey] !== null) {
    return;
  }

  const annualRent = calculateAnnualRentFromYield(
    values.asking_price,
    values[yieldKey]
  );

  if (annualRent === null) {
    return;
  }

  values[annualKey] = annualRent;
  values[monthlyKey] = roundMoney(calculateMonthlyRentFromAnnual(annualRent));
}

function addRentMismatchWarning(
  warnings: string[],
  monthlyRent: number | null,
  annualRent: number | null,
  message: string
) {
  if (
    monthlyRent !== null &&
    annualRent !== null &&
    Math.abs(calculateAnnualRentFromMonthly(monthlyRent) - annualRent) >
      ANNUAL_RENT_TOLERANCE
  ) {
    warnings.push(message);
  }
}

function addYieldMismatchWarning(
  warnings: string[],
  manualYield: number | null,
  calculatedYield: number | null,
  message: string
) {
  if (
    manualYield !== null &&
    calculatedYield !== null &&
    Math.abs(manualYield - calculatedYield) > YIELD_TOLERANCE
  ) {
    warnings.push(message);
  }
}

export function validateDealMetrics(inputs: DealMetricInputs): DealMetricValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const calculatedGrossYield = roundGrossYield(
    calculateGrossYield(inputs.asking_price, inputs.annual_rent_full)
  );
  const calculatedCurrentYield = roundGrossYield(
    calculateGrossYield(inputs.asking_price, inputs.annual_rent_current)
  );

  if (inputs.asking_price !== null && inputs.asking_price <= 0) {
    errors.push("Asking price must be greater than 0 when provided.");
  }

  addRentMismatchWarning(
    warnings,
    inputs.monthly_rent_full,
    inputs.annual_rent_full,
    "Monthly rent x 12 does not match annual rent."
  );

  addRentMismatchWarning(
    warnings,
    inputs.monthly_rent_current,
    inputs.annual_rent_current,
    "Current monthly rent x 12 does not match current annual rent."
  );

  addYieldMismatchWarning(
    warnings,
    inputs.gross_yield_full,
    calculatedGrossYield,
    "入力された満室想定利回りと、賃料・価格から計算した利回りが一致しません。"
  );

  addYieldMismatchWarning(
    warnings,
    inputs.current_yield,
    calculatedCurrentYield,
    "入力された現況利回りと、現況賃料・価格から計算した利回りが一致しません。"
  );

  return {
    errors,
    warnings
  };
}

export function normalizeDealMetrics(inputs: DealMetricInputs) {
  const values: DealMetricValues = {
    ...inputs,
    calculated_gross_yield_full: null,
    calculated_current_yield: null
  };

  fillRentPairFromYield(
    values,
    "annual_rent_full",
    "monthly_rent_full",
    "gross_yield_full"
  );

  if (values.monthly_rent_full !== null && values.annual_rent_full === null) {
    values.annual_rent_full = roundMoney(
      calculateAnnualRentFromMonthly(values.monthly_rent_full)
    );
  }

  if (values.annual_rent_full !== null && values.monthly_rent_full === null) {
    values.monthly_rent_full = roundMoney(
      calculateMonthlyRentFromAnnual(values.annual_rent_full)
    );
  }

  fillRentPairFromYield(
    values,
    "annual_rent_current",
    "monthly_rent_current",
    "current_yield"
  );

  if (values.monthly_rent_current !== null && values.annual_rent_current === null) {
    values.annual_rent_current = roundMoney(
      calculateAnnualRentFromMonthly(values.monthly_rent_current)
    );
  }

  if (values.annual_rent_current !== null && values.monthly_rent_current === null) {
    values.monthly_rent_current = roundMoney(
      calculateMonthlyRentFromAnnual(values.annual_rent_current)
    );
  }

  values.calculated_gross_yield_full = roundGrossYield(
    calculateGrossYield(values.asking_price, values.annual_rent_full)
  );
  values.calculated_current_yield = roundGrossYield(
    calculateGrossYield(values.asking_price, values.annual_rent_current)
  );

  const validation = validateDealMetrics(values);

  return {
    values,
    errors: validation.errors,
    warnings: validation.warnings
  };
}
