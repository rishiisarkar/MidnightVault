import type { TransactionProgressStage } from "@/lib/midnight-client";

export type ProgressStage = TransactionProgressStage | "idle" | "confirming" | "confirmed" | "error";

export function isActiveProgress(stage: ProgressStage): boolean {
  return ["preparing", "proving", "balancing", "awaiting_wallet", "submitted", "confirming"].includes(stage);
}

export function progressLabel(stage: ProgressStage, context: "enroll" | "prove" | "deploy" = "prove"): string {
  const map: Record<ProgressStage, string> = {
    idle: context === "enroll" ? "Ready to issue" : context === "deploy" ? "Ready to deploy" : "Ready",
    preparing: "Preparing transaction",
    proving: "Generating zero-knowledge proof",
    balancing: "Balancing transaction fees",
    awaiting_wallet: "Approve in your wallet",
    submitted: "Submitted to network",
    confirming: "Waiting for network confirmation",
    confirmed: context === "enroll" ? "Credential enrolled" : context === "deploy" ? "Gate published" : "Access confirmed",
    error: "Needs attention",
  };
  return map[stage];
}

export function progressDetail(stage: ProgressStage): string {
  switch (stage) {
    case "preparing":
      return "Building the unproven Midnight transaction from the current contract state.";
    case "proving":
      return "Creating the zero-knowledge proof. This can take several seconds.";
    case "balancing":
      return "The wallet is adding fees and sealing the transaction.";
    case "awaiting_wallet":
      return "Confirm the request in your wallet extension when prompted.";
    case "submitted":
      return "The sealed transaction was sent to the selected Midnight network.";
    case "confirming":
      return "Polling the Midnight indexer until the on-chain state updates.";
    case "confirmed":
      return "The network has confirmed this action.";
    case "error":
      return "Review the message below, then retry when ready.";
    default:
      return "Waiting for the next action.";
  }
}
