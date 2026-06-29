# Master Data and Financing Semantics

Status: v0.1
Scope date: 2026-06 closeout

## Canonical Property Code Sequence

The active portfolio property code sequence is:

| sequence | property_code | property_name | unit_count |
| --- | --- | --- | --- |
| 1 | P001_NAKA_OKACHIMACHI | Naka Okachimachi | Existing seed count |
| 2 | P002_EDOGAWABASHI | Edogawabashi | Existing seed count |
| 3 | P003_YASURA | Yasura | Existing seed count |
| 4 | P004_SAKADO | Sakado | Existing seed count |
| 5 | P005_HAITSU_KAWASAKA | Haits Kawasaka | 4 |
| 6 | P006_MAISON_MORIYA | Maison Moriya | 6 |

Property codes are stable reporting identifiers. They should not be reused for
different assets after a property leaves the portfolio.

## Loan Balance Semantics

`original_principal` and `current_balance` must remain separate:

- `original_principal`: initial borrowing amount for acquisition and historical
  analysis.
- `current_balance`: latest outstanding principal balance used by Dashboard,
  Bank Summary, portfolio LTV, and property LTV.
- `balance_as_of_date`: date attached to the `current_balance` value.

Dashboard and Bank Summary labels should use "Current Loan Balance" to make it
clear that the displayed value is not acquisition-time debt.

If a loan does not yet have a verified latest outstanding balance,
`current_balance` can temporarily be backfilled from the best available loan
balance source, with `balance_as_of_date` populated. That row should be reviewed
against a loan statement before lender-facing use.
