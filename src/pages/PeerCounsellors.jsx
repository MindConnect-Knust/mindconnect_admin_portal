import { useData } from "../context/DataContext";
import UserManagementView from "../components/users/UserManagementView";

export default function PeerCounsellors() {
  const { peerCounsellors } = useData();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Peer Counsellors</h2>
        <p className="mt-1 text-sm text-slate-500">
          Students trained and certified to support their peers. Manage their status or view individual profiles.
        </p>
      </div>
      <UserManagementView
        users={peerCounsellors}
        subtitleField={(u) => `${u.program} · Year ${u.yearOfStudy}`}
        emptyLabel="No peer counsellors match your search or filters."
      />
    </div>
  );
}
