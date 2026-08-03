import { useData } from "../context/DataContext";
import UserManagementView from "../components/users/UserManagementView";

export default function Counsellors() {
  const { counsellors } = useData();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Counsellors</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lecturers and professionals approved to counsel students. Manage their status or view individual profiles.
        </p>
      </div>
      <UserManagementView
        users={counsellors}
        subtitleField={(u) => u.title || u.department}
        emptyLabel="No counsellors match your search or filters."
      />
    </div>
  );
}
