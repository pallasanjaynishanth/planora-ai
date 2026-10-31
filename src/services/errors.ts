import { ZodError } from "zod";
export function errorMessage(error: unknown): string {
  if (error instanceof ZodError)
    return error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
      .join(" ");
  if (error instanceof Error) {
    if (/permission-denied|insufficient permissions/i.test(error.message))
      return "Access denied. Check your sign-in, ownership, App Check and deployed Firestore rules.";
    if (/429|quota|resource-exhausted/i.test(error.message))
      return "Request limit reached. Wait before trying again and check your Firebase quotas.";
    if (/auth\//i.test(error.message))
      return "Authentication failed. Check your credentials and enabled sign-in provider, then try again.";
    if (/network|unavailable|fetch failed/i.test(error.message))
      return "Service unavailable or offline. Your current plan has been kept. Try again when connected.";
    return error.message.slice(0, 500);
  }
  return "Something went wrong. Your current plan has been kept.";
}
