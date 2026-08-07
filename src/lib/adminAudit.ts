import { supabase } from "@/integrations/supabase/client";

export type AdminActionType =
  | "deposit_confirmed"
  | "deposit_rejected"
  | "dispute_resolved"
  | "status_override"
  | "winnings_released"
  | "payout_marked_paid"
  | "pool_seat_deposit_confirmed"
  | "pool_seat_rejected"
  | "pool_deposit_confirmed"
  | "pool_winnings_released"
  | "pool_cancelled";

/**
 * Records an admin action in the immutable admin audit log.
 * Never throws — logging must not block the underlying admin action.
 */
export async function logAdminAction(
  actionType: AdminActionType,
  description: string,
  opts: {
    sessionId?: string | null;
    userId?: string | null;
    details?: Record<string, unknown>;
  } = {}
) {
  try {
    await supabase.rpc("log_admin_action", {
      _action_type: actionType,
      _description: description,
      _target_session_id: opts.sessionId ?? null,
      _target_user_id: opts.userId ?? null,
      _details: (opts.details ?? {}) as any,
    });
  } catch (err) {
    console.error("Failed to write admin audit log", err);
  }
}
