# June Closeout Specs for 77Days Property OS

Status: v0.1 documentation closure
Scope date: 2026-06 closeout

This document closes the remaining June DoD items for accounting mapping,
Yayoi CSV staging, and the manual conversion flow. It does not define CSV
export, PDF export, OCR, file upload, or full lease management.

## Accounting Mapping v0.1

The accounting mapping defines how a manually reviewed transaction should be
classified before it is entered into `property_expenses` and reflected in
Monthly PL.

| standard_category | accounting_account | cashflow_category | PL/CF | data_grain | unit_id_required | lease_id_required | contract_reconciliation_required | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repairs | Repairs and maintenance | operating_expense | PL | unit_or_property | false | false | false | Use unit_id when the repair is room-specific. |
| Cleaning | Cleaning expense | operating_expense | PL | unit_or_property | false | false | false | Use unit_id for move-in, move-out, or room-specific cleaning. |
| Advertising | Advertising expense | operating_expense | PL | unit_or_property | false | false | false | Use unit_id when tied to a specific vacancy. |
| Move-out cost | Repairs and maintenance | operating_expense | PL | unit | true | false | false | Unit attribution is required because the cost is room-specific. |
| Utilities | Utilities | operating_expense | PL | property | false | false | false | Property-level unless separately metered to a unit. |
| Property management | Management fee | operating_expense | PL | property | false | false | false | Standard operating expense for property NOI draft. |
| Insurance | Insurance expense | insurance | PL | property | false | false | false | Included in operating expense draft when flagged as operating. |
| Property tax | Taxes and dues | tax | PL | property | false | false | false | Included in tax totals and operating expense draft when flagged as operating. |
| Loan interest | Interest expense | loan_interest | CF | property | false | false | true | Financing item; affects financing and cf_draft, not operating_expenses. |
| Loan principal | Loan principal payment | loan_principal | CF | property | false | false | true | Financing cash flow item; not PL operating expense. |
| Capex | Capital expenditure | capex | CF | property | false | false | false | Excluded from operating NOI draft; included in cf_draft. |
| Owner adjustment | Owner draw/contribution | owner_adjustment | CF | property | false | false | false | Non-PL cash flow item. |
| Other | Miscellaneous expense | other | CF | unit_or_property | false | false | false | Requires reviewer memo when used. |

Rules:

- `standard_category` is the normalized business category used by 77Days.
- `accounting_account` is the intended accounting account label for staging.
- `cashflow_category` must align with the enum-like values used by
  `property_expenses`.
- `PL/CF` distinguishes profit-and-loss classification from cash-flow-only
  classification.
- `data_grain` indicates whether a row should normally be property-level,
  unit-level, or either.
- `unit_id_required` is true only when a transaction cannot be useful without
  a unit attribution.
- `lease_id_required` remains false in v0.1 because full lease management is
  not implemented yet.
- `contract_reconciliation_required` is true for loan-related rows that should
  later be checked against financing contracts.

## Yayoi CSV Staging v0.1 Field Definition

The staging layer is a future read-only/export preparation shape. This task
does not implement the export.

| field_name | type | required | source | notes |
| --- | --- | --- | --- | --- |
| property_id | uuid | true | properties/property_expenses | Internal property identifier. |
| property_code | text | true | properties | Human-readable property code. |
| property_name | text | true | properties | Human-readable property name. |
| unit_id | uuid | false | units/property_expenses | Null for property-level rows. |
| unit_name | text | false | units | Null for property-level rows. |
| lease_id | uuid | false | property_expenses | Optional in v0.1. |
| period_month | date | true | property_expenses | Month-start date, for example `2026-06-01`. |
| transaction_date | date | false | property_expenses | Actual transaction date when known. |
| direction | text | true | derived | `inflow` or `outflow`. Expenses are `outflow`. |
| standard_category | text | true | accounting mapping | Normalized 77Days category. |
| accounting_account | text | true | accounting mapping/property_expenses | Target accounting account label. |
| tax_category | text | false | reviewer/accounting mapping | Future Yayoi tax treatment field. |
| amount | numeric | true | property_expenses | Positive amount. Direction determines inflow/outflow. |
| vendor_name | text | false | source/reviewer | Vendor or payee name when available. |
| description | text | false | property_expenses/source | Human-readable transaction description. |
| source_file_name | text | false | source file | Source statement or receipt filename. |
| review_status | text | true | reviewer workflow | Suggested values: `draft`, `reviewed`, `approved`, `excluded`. |
| memo | text | false | reviewer | Reviewer notes and exceptions. |

## Manual Conversion Flow

1. Source statement
   - Collect bank statement, card statement, loan statement, receipt, or
     property manager statement.
   - Identify transaction date, amount, vendor/payee, source file name, and
     raw description.

2. Unit/property/lease mapping
   - Decide whether the transaction belongs to a property, a unit, or a future
     lease-level record.
   - Property-level rows use `property_id` and leave `unit_id` and `lease_id`
     null.
   - Unit-specific rows use both `property_id` and `unit_id`.
   - `lease_id` can remain null in v0.1.

3. Accounting mapping
   - Assign `standard_category`, `accounting_account`, and
     `cashflow_category`.
   - Derive flags for operating expense, capex, financing, and tax based on
     `cashflow_category`.
   - Mark whether contract reconciliation is required for financing-related
     rows.

4. DB entry
   - Enter the reviewed row into `property_expenses`.
   - Use `transaction_date` as the expense date.
   - Use `period_month` as the month-start reporting period.
   - Keep amount positive and use category/direction semantics for reporting.

5. Monthly PL
   - `monthly_pl_property_view` rolls up rent and property/unit-level expense
     records into Property Summary.
   - `monthly_pl_unit_view` reflects unit-level rent and unit-level expenses
     into Unit Summary.
   - Property-level financing items affect financing and `cf_draft`, not
     operating expenses.

6. CSV staging
   - Prepare a staging row using the Yayoi CSV staging v0.1 field definition.
   - Keep rows in `draft` or `reviewed` status until accounting review is
     complete.
   - CSV export itself is out of scope for June closeout.

## June DoD Completion Marks

- [x] `/expenses` property-level expense test
- [x] `/expenses` unit-level expense test
- [x] `/monthly-pl` Property Summary reflection
- [x] `/monthly-pl` Unit Summary reflection
- [x] `period_month` / empty state / amount display review

## Explicitly Out of Scope Today

- CSV export
- PDF export
- OCR
- File upload
- Full lease management
- Real DSCR replacement
