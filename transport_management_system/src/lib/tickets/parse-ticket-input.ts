/** Extract ticket code from raw input or QR JSON payload */
export function parseTicketInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, string>;
      if (parsed.ticket_code) return parsed.ticket_code.trim();
      if (parsed.ticketCode) return parsed.ticketCode.trim();
    } catch {
      // not JSON — fall through
    }
  }

  return trimmed;
}
