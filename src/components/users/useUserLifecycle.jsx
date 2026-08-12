import { useState } from "react";
import { useData } from "../../context/DataContext";
import ConfirmDialog from "../common/ConfirmDialog";

export function useUserLifecycle() {
  const { updateUserStatus, deleteUser } = useData();
  const [holdTarget, setHoldTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const dialogs = (
    <>
      <ConfirmDialog
        open={!!holdTarget}
        onClose={() => setHoldTarget(null)}
        onConfirm={(reason) => updateUserStatus(holdTarget.id, "on_hold", reason).then(() => setHoldTarget(null))}
        title="Suspend provider capability"
        description={`${holdTarget?.name} will be removed from public support directories and cannot use provider tools until reinstated. Their personal account remains available.`}
        confirmLabel="Suspend"
        tone="warning"
        requireReason
        reasonLabel="Reason for suspension"
      />
      <ConfirmDialog
        open={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={() => updateUserStatus(reactivateTarget.id, "active", "Reinstated by administrator.").then(() => setReactivateTarget(null))}
        title="Reinstate provider capability"
        description={`${reactivateTarget?.name} will return to the approved provider directory.`}
        confirmLabel="Reinstate"
        tone="default"
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(reason) => deleteUser(deleteTarget.id, reason).then(() => setDeleteTarget(null))}
        title="Revoke provider access"
        description={`This will revoke ${deleteTarget?.name}'s provider capability and remove them from public support directories. Their account and audit history will be retained.`}
        confirmLabel="Revoke access"
        tone="danger"
        requireReason
        reasonLabel="Reason for revocation"
      />
    </>
  );

  return { setHoldTarget, setReactivateTarget, setDeleteTarget, dialogs };
}