import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useData } from "../context/DataContext";
import Tabs from "../components/common/Tabs";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ApplicationCard from "../components/approvals/ApplicationCard";
import ApplicationDetailModal from "../components/approvals/ApplicationDetailModal";

export default function Approvals() {
  const { applications, approveApplication, rejectApplication } = useData();
  const [tab, setTab] = useState("counsellor");
  const [viewing, setViewing] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const counsellorApps = useMemo(() => applications.filter((a) => a.role === "counsellor"), [applications]);
  const peerApps = useMemo(() => applications.filter((a) => a.role === "peer_listener"), [applications]);
  const list = tab === "counsellor" ? counsellorApps : peerApps;

  const handleApprove = async (reason) => {
    await approveApplication(approveTarget.id);
    setApproveTarget(null);
    setViewing(null);
  };

  const handleReject = async (reason) => {
    await rejectApplication(rejectTarget.id, reason);
    setRejectTarget(null);
    setViewing(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Approvals</h2>
        <p className="mt-1 text-sm text-slate-500">Review new sign-ups before they gain access to student cases.</p>
      </div>

      <Tabs
        tabs={[
          { value: "counsellor", label: "Counsellor Applications", count: counsellorApps.length },
          { value: "peer_listener", label: "Peer Counsellor Applications", count: peerApps.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No pending applications"
          description={`There are currently no ${tab === "counsellor" ? "counsellor" : "peer counsellor"} applications awaiting review.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onView={setViewing}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      <ApplicationDetailModal
        application={viewing}
        onClose={() => setViewing(null)}
        onApprove={setApproveTarget}
        onReject={setRejectTarget}
      />

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve application"
        description={`${approveTarget?.name} will be granted access as an active ${approveTarget?.role === "peer_listener" ? "peer counsellor" : "counsellor"} and can immediately begin taking student cases.`}
        confirmLabel="Approve"
        tone="default"
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Reject application"
        description={`${rejectTarget?.name}'s application will be declined. Please provide a reason — it will be kept in the audit trail.`}
        confirmLabel="Reject application"
        tone="danger"
        requireReason
        reasonLabel="Reason for rejection"
        reasonPlaceholder="e.g. Missing required license documentation…"
      />
    </div>
  );
}
