import { useState } from "react";
import { useData } from "../../context/DataContext";
import ConfirmDialog from "../common/ConfirmDialog";

// Shared hold/reactivate/deactivate/delete flow (confirm dialogs + wiring to
// DataContext) so both the management tables and the profile page stay in sync.
export function useUserLifecycle() {
  const { updateUserStatus, deleteUser } = useData();
  const [holdTarget, setHoldTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const dialogs = (
    <>
      <ConfirmDialog
        open={!!holdTarget}
        onClose={() => setHoldTarget(null)}
        onConfirm={(reason) => updateUserStatus(holdTarget.id, "on_hold", reason).then(() => setHoldTarget(null))}
        title="Put account on hold"
        description={`${holdTarget?.name} will be temporarily paused and won't be assigned new students until reactivated.`}
        confirmLabel="Put on hold"
        tone="warning"
        requireReason
        reasonLabel="Reason for hold"
      />

      <ConfirmDialog
        open={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={() =>
          updateUserStatus(reactivateTarget.id, "active", "Reactivated by admin.").then(() => setReactivateTarget(null))
        }
        title="Reactivate account"
        description={`${reactivateTarget?.name} will be marked active again and can resume taking student cases.`}
        confirmLabel="Reactivate"
        tone="default"
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={(reason) => updateUserStatus(deactivateTarget.id, "deactivated", reason).then(() => setDeactivateTarget(null))}
        title="Deactivate account"
        description={`${deactivateTarget?.name} will lose access to the platform. This can be reversed later by an admin if needed.`}
        confirmLabel="Deactivate"
        tone="danger"
        requireReason
        reasonLabel="Reason for deactivation"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(reason) => deleteUser(deleteTarget.id, reason).then(() => setDeleteTarget(null))}
        title="Delete profile permanently"
        description={`This will permanently remove ${deleteTarget?.name}'s profile, including their activity history. This cannot be undone.`}
        confirmLabel="Delete profile"
        tone="danger"
        requireReason
        reasonLabel="Reason for deletion"
      />
    </>
  );

  return { setHoldTarget, setReactivateTarget, setDeactivateTarget, setDeleteTarget, dialogs };
}
