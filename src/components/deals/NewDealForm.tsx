"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createDeal } from "@/app/deals/actions";
import type { CreateDealActionState } from "@/app/deals/actions";
import {
  DEAL_STATUS_OPTIONS,
  FINAL_DECISION_OPTIONS,
  PROPERTY_TYPE_OPTIONS
} from "@/lib/dealConstants";
import {
  calculateAnnualRentFromMonthly,
  calculateGrossYield,
  calculateMonthlyRentFromAnnual,
  parseDealNumberInput,
  roundGrossYield,
  validateDealMetrics
} from "@/lib/dealMetrics";

type MetricField =
  | "asking_price"
  | "monthly_rent_full"
  | "annual_rent_full"
  | "monthly_rent_current"
  | "annual_rent_current"
  | "gross_yield_full"
  | "current_yield";

type FormValues = Record<MetricField, string>;

type RentTouchedState = {
  full: boolean;
  current: boolean;
};

const DASH = "—";

const initialValues: FormValues = {
  asking_price: "",
  monthly_rent_full: "",
  annual_rent_full: "",
  monthly_rent_current: "",
  annual_rent_current: "",
  gross_yield_full: "",
  current_yield: ""
};

const initialRentTouched: RentTouchedState = {
  full: false,
  current: false
};

const initialActionState: CreateDealActionState = {
  status: "idle",
  message: "",
  warnings: []
};

function parseInput(value: string) {
  return parseDealNumberInput(value, "value").value;
}

function formatInputNumber(value: number, fractionDigits = 0) {
  return value.toFixed(fractionDigits).replace(/\.?0+$/, "");
}

function formatDisplayNumber(value: string) {
  const parsed = parseInput(value);

  if (parsed === null) {
    return DASH;
  }

  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 2
  }).format(parsed);
}

function formatDisplayYield(value: number | null) {
  if (value === null) {
    return DASH;
  }

  return `${new Intl.NumberFormat("ja-JP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}%`;
}

function formatInlineYield(value: string) {
  const parsed = parseInput(value);

  if (parsed === null) {
    return DASH;
  }

  return `${new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 2
  }).format(parsed)}%`;
}

function getWarnings(values: FormValues) {
  return validateDealMetrics({
    asking_price: parseInput(values.asking_price),
    monthly_rent_full: parseInput(values.monthly_rent_full),
    annual_rent_full: parseInput(values.annual_rent_full),
    monthly_rent_current: parseInput(values.monthly_rent_current),
    annual_rent_current: parseInput(values.annual_rent_current),
    gross_yield_full: parseInput(values.gross_yield_full),
    current_yield: parseInput(values.current_yield)
  }).warnings;
}

function isFullRentField(field: MetricField) {
  return field === "monthly_rent_full" || field === "annual_rent_full";
}

function isCurrentRentField(field: MetricField) {
  return field === "monthly_rent_current" || field === "annual_rent_current";
}

function shouldYieldDriveRent(
  touched: boolean,
  monthlyRent: string,
  annualRent: string
) {
  return !touched || (monthlyRent.trim() === "" && annualRent.trim() === "");
}

function applyYieldDrivenRent(
  values: FormValues,
  monthlyKey: "monthly_rent_full" | "monthly_rent_current",
  annualKey: "annual_rent_full" | "annual_rent_current",
  listingYield: number | null,
  askingPrice: number | null
) {
  if (askingPrice === null || askingPrice <= 0 || listingYield === null) {
    values[monthlyKey] = "";
    values[annualKey] = "";
    return;
  }

  const annualRent = (askingPrice * listingYield) / 100;
  values[annualKey] = formatInputNumber(annualRent, 2);
  values[monthlyKey] = formatInputNumber(
    calculateMonthlyRentFromAnnual(annualRent),
    2
  );
}

function deriveValues(
  values: FormValues,
  editedField: MetricField,
  rentTouched: RentTouchedState
): FormValues {
  const next = { ...values };
  const askingPrice = parseInput(next.asking_price);
  const grossYieldFull = parseInput(next.gross_yield_full);
  const currentYield = parseInput(next.current_yield);

  if (
    (editedField === "asking_price" || editedField === "gross_yield_full") &&
    shouldYieldDriveRent(
      rentTouched.full,
      next.monthly_rent_full,
      next.annual_rent_full
    )
  ) {
    applyYieldDrivenRent(
      next,
      "monthly_rent_full",
      "annual_rent_full",
      grossYieldFull,
      askingPrice
    );
  }

  if (
    (editedField === "asking_price" || editedField === "current_yield") &&
    shouldYieldDriveRent(
      rentTouched.current,
      next.monthly_rent_current,
      next.annual_rent_current
    )
  ) {
    applyYieldDrivenRent(
      next,
      "monthly_rent_current",
      "annual_rent_current",
      currentYield,
      askingPrice
    );
  }

  const monthlyRentFull = parseInput(next.monthly_rent_full);
  const annualRentFull = parseInput(next.annual_rent_full);
  const monthlyRentCurrent = parseInput(next.monthly_rent_current);
  const annualRentCurrent = parseInput(next.annual_rent_current);

  if (
    editedField === "monthly_rent_full" &&
    monthlyRentFull !== null &&
    next.annual_rent_full.trim() === ""
  ) {
    next.annual_rent_full = formatInputNumber(
      calculateAnnualRentFromMonthly(monthlyRentFull),
      2
    );
  }

  if (
    editedField === "annual_rent_full" &&
    annualRentFull !== null &&
    next.monthly_rent_full.trim() === ""
  ) {
    next.monthly_rent_full = formatInputNumber(
      calculateMonthlyRentFromAnnual(annualRentFull),
      2
    );
  }

  if (
    editedField === "monthly_rent_current" &&
    monthlyRentCurrent !== null &&
    next.annual_rent_current.trim() === ""
  ) {
    next.annual_rent_current = formatInputNumber(
      calculateAnnualRentFromMonthly(monthlyRentCurrent),
      2
    );
  }

  if (
    editedField === "annual_rent_current" &&
    annualRentCurrent !== null &&
    next.monthly_rent_current.trim() === ""
  ) {
    next.monthly_rent_current = formatInputNumber(
      calculateMonthlyRentFromAnnual(annualRentCurrent),
      2
    );
  }

  return next;
}

export function NewDealForm() {
  const [actionState, formAction] = useFormState(createDeal, initialActionState);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [rentTouched, setRentTouched] =
    useState<RentTouchedState>(initialRentTouched);
  const warnings = getWarnings(values);
  const calculatedGrossYieldFull = roundGrossYield(
    calculateGrossYield(parseInput(values.asking_price), parseInput(values.annual_rent_full))
  );
  const calculatedCurrentYield = roundGrossYield(
    calculateGrossYield(
      parseInput(values.asking_price),
      parseInput(values.annual_rent_current)
    )
  );

  function handleMetricChange(field: MetricField, value: string) {
    const nextRentTouched = {
      full: rentTouched.full || isFullRentField(field),
      current: rentTouched.current || isCurrentRentField(field)
    };

    setRentTouched(nextRentTouched);
    setValues((current) =>
      deriveValues({ ...current, [field]: value }, field, nextRentTouched)
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Deal name"
          name="deal_name"
          required
          placeholder="e.g. Setagaya 8-unit apartment"
        />
        <TextField label="Property name" name="property_name" />
        <TextField label="Address" name="address" />
        <label className="block">
          <span className="text-sm font-medium text-ink/70">Property type</span>
          <select
            name="property_type"
            defaultValue=""
            className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="">Select property type</option>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="rounded border border-ink/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink">Price</p>
        <div className="mt-3 max-w-md">
          <NumberField
            label="Asking price"
            name="asking_price"
            value={values.asking_price}
            onChange={(value) => handleMetricChange("asking_price", value)}
          />
          <p className="mt-2 text-xs text-ink/50">
            {formatDisplayNumber(values.asking_price)}
          </p>
        </div>
      </section>

      <RentMetricSection
        title="Full occupancy"
        yieldLabel="満室想定利回り"
        yieldName="gross_yield_full"
        yieldValue={values.gross_yield_full}
        monthlyLabel="Monthly rent full"
        monthlyName="monthly_rent_full"
        monthlyValue={values.monthly_rent_full}
        annualLabel="Annual rent full"
        annualName="annual_rent_full"
        annualValue={values.annual_rent_full}
        calculatedLabel="満室想定利回りチェック"
        calculatedValue={calculatedGrossYieldFull}
        helperText="価格と満室想定利回りから、満室想定賃料を自動計算します。"
        onMetricChange={handleMetricChange}
      />

      <RentMetricSection
        title="Current rent"
        yieldLabel="現況利回り"
        yieldName="current_yield"
        yieldValue={values.current_yield}
        monthlyLabel="Monthly rent current"
        monthlyName="monthly_rent_current"
        monthlyValue={values.monthly_rent_current}
        annualLabel="Annual rent current"
        annualName="annual_rent_current"
        annualValue={values.annual_rent_current}
        calculatedLabel="現況利回りチェック"
        calculatedValue={calculatedCurrentYield}
        helperText="価格と現況利回りから、現況賃料を自動計算します。"
        onMetricChange={handleMetricChange}
      />

      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <p
              key={warning}
              className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {actionState.status === "error" ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{actionState.message}</p>
          {actionState.warnings.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {actionState.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink/70">Status</span>
          <select
            name="status"
            defaultValue="sourced"
            className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            {DEAL_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/70">Final decision</span>
          <select
            name="final_decision"
            defaultValue="undecided"
            className="mt-1 w-full rounded border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          >
            {FINAL_DECISION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextAreaField label="Memo" name="memo" />
        <TextAreaField label="Next action" name="next_action" />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg border-2 border-black bg-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-300 hover:shadow-md"
      >
        Create deal
      </button>
    </form>
  );
}

function RentMetricSection({
  title,
  yieldLabel,
  yieldName,
  yieldValue,
  monthlyLabel,
  monthlyName,
  monthlyValue,
  annualLabel,
  annualName,
  annualValue,
  calculatedLabel,
  calculatedValue,
  helperText,
  onMetricChange
}: {
  title: string;
  yieldLabel: string;
  yieldName: MetricField;
  yieldValue: string;
  monthlyLabel: string;
  monthlyName: MetricField;
  monthlyValue: string;
  annualLabel: string;
  annualName: MetricField;
  annualValue: string;
  calculatedLabel: string;
  calculatedValue: number | null;
  helperText: string;
  onMetricChange: (field: MetricField, value: string) => void;
}) {
  return (
    <section className="rounded border border-ink/10 bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-xs text-ink/50">{helperText}</p>
        </div>
        <div className="rounded border border-ink/10 bg-paper/60 px-3 py-2">
          <p className="text-xs font-semibold text-ink/50">{calculatedLabel}</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {formatDisplayYield(calculatedValue)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <NumberField
          label={yieldLabel}
          name={yieldName}
          value={yieldValue}
          onChange={(value) => onMetricChange(yieldName, value)}
          step="0.01"
        />
        <NumberField
          label={monthlyLabel}
          name={monthlyName}
          value={monthlyValue}
          onChange={(value) => onMetricChange(monthlyName, value)}
        />
        <NumberField
          label={annualLabel}
          name={annualName}
          value={annualValue}
          onChange={(value) => onMetricChange(annualName, value)}
        />
      </div>

      <div className="mt-2 grid gap-2 text-xs text-ink/50 lg:grid-cols-3">
        <p>{formatInlineYield(yieldValue)}</p>
        <p>{formatDisplayNumber(monthlyValue)}</p>
        <p>{formatDisplayNumber(annualValue)}</p>
      </div>
    </section>
  );
}

function TextField({
  label,
  name,
  required = false,
  placeholder
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <input
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  step = "1"
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <input
        name={name}
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
      />
    </label>
  );
}

function TextAreaField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <textarea
        name={name}
        rows={5}
        className="mt-1 w-full rounded border border-ink/15 px-3 py-2 text-sm text-ink"
      />
    </label>
  );
}
