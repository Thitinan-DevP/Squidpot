export type PlayReceiptObservation = {
  action: string;
  receiptStatus?: "success" | "reverted";
  transactionHash?: string;
  requestId?: string;
};

export function confirmedPlayAnimationKey(observation: PlayReceiptObservation): string | undefined {
  if (observation.action !== "play" || observation.receiptStatus !== "success"
    || !observation.transactionHash || !observation.requestId) return undefined;
  return `${observation.transactionHash}:${observation.requestId}`;
}
