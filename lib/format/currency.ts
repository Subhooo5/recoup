const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatRupees = (paise: number) => rupeeFormatter.format(paise / 100);

export const formatOptionalRupees = (paise: number | null | undefined) =>
  paise === null || paise === undefined ? "—" : formatRupees(paise);
