import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, PauseCircle, PlayCircle, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserActionsMenu({ user, onHold, onReactivate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const onClick = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const items = [
    { label: "View profile", icon: Eye, onClick: () => navigate(`/users/${user.id}`) },
    user.status === "active" ? { label: "Suspend", icon: PauseCircle, onClick: () => onHold(user) } : null,
    user.status === "on_hold" ? { label: "Reinstate", icon: PlayCircle, onClick: () => onReactivate(user) } : null,
    user.status !== "deactivated" ? { label: "Revoke access", icon: ShieldOff, onClick: () => onDelete(user), danger: true } : null,
  ].filter(Boolean);

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={(event) => event.stopPropagation()}>
      <button onClick={() => setOpen((value) => !value)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Row actions">
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button key={item.label} onClick={() => { setOpen(false); item.onClick(); }} className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${item.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"}`}>
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}