declare module '@shared/formatting' {
  export const normalizeDigits: (value: string) => string;
  export const formatNumber: (num: number | null | undefined) => string;
  export const formatCurrency: (num: number | null | undefined, includeDecimals?: boolean) => string;
  export const formatPercentage: (num: number | null | undefined) => string;
  export const formatArea: (num: number | null | undefined) => string;
  export const formatPricePerUnit: (num: number | null | undefined) => string;
  export const formatPercentageWithDecimal: (num: number | null | undefined, decimalPlaces?: number) => string;
  export const formatDate: (date: Date | string | null | undefined) => string;
}
