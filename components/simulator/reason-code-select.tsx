"use client";

export const razorpayErrorCodes = ["GATEWAY_ERROR", "BAD_REQUEST_ERROR"] as const;

export const razorpayErrorReasons = [
  "payment_failed",
  "insufficient_funds",
  "payment_timed_out",
] as const;

export type RazorpayErrorCode = (typeof razorpayErrorCodes)[number];
export type RazorpayErrorReason = (typeof razorpayErrorReasons)[number];

type ReasonCodeSelectProps = {
  errorCode: RazorpayErrorCode;
  errorReason: RazorpayErrorReason;
  onErrorCodeChange: (value: RazorpayErrorCode) => void;
  onErrorReasonChange: (value: RazorpayErrorReason) => void;
  disabled: boolean;
};

const selectClassName =
  "h-10 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors duration-200 focus:border-brand-indigo focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export function ReasonCodeSelect({
  errorCode,
  errorReason,
  onErrorCodeChange,
  onErrorReasonChange,
  disabled,
}: ReasonCodeSelectProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Error code</span>
        <select
          value={errorCode}
          disabled={disabled}
          onChange={(event) =>
            onErrorCodeChange(event.target.value as RazorpayErrorCode)
          }
          className={selectClassName}
        >
          {razorpayErrorCodes.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Error reason</span>
        <select
          value={errorReason}
          disabled={disabled}
          onChange={(event) =>
            onErrorReasonChange(event.target.value as RazorpayErrorReason)
          }
          className={selectClassName}
        >
          {razorpayErrorReasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
