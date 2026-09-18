import { useEffect, useState } from "react";
import { staffConcernApi } from "../../services/staffConcernApi";

/**
 * Verified support services for staff. Contacts come only from the verified
 * SupportService directory; nothing is hardcoded here, so a changed number is
 * corrected once, by the people who verify it.
 */
export default function EmergencyServices() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    staffConcernApi.guidanceServices().then(setServices).catch((err) => setError(err.message));
  }, []);

  if (error) return <p role="alert" className="text-sm text-rose-700">Verified contacts could not be loaded. Use your institution’s emergency procedure.</p>;
  if (!services) return <p className="text-sm text-slate-500">Loading verified contacts…</p>;
  if (!services.length) {
    return <p className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">No verified contacts have been published yet. Follow your college or hall emergency procedure.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => (
        <li key={service.key} className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-900">{service.name}</p>
          {service.emergencyAvailability && <p className="text-xs font-semibold text-slate-700">Available outside normal hours</p>}
          {service.description && <p className="mt-1 text-xs text-slate-600">{service.description}</p>}
          <ul className="mt-2 space-y-1">
            {service.contactMethods.map((method) => (
              <li key={`${method.kind}-${method.value}`} className="text-sm">
                {method.kind === "PHONE" ? (
                  <a className="font-semibold text-emerald-800 underline" href={`tel:${method.value}`}>{method.display}</a>
                ) : method.kind === "EMAIL" ? (
                  <a className="font-semibold text-emerald-800 underline" href={`mailto:${method.value}`}>{method.display}</a>
                ) : (
                  <span className="text-slate-800">{method.display}</span>
                )}
                {method.detail && <span className="text-xs text-slate-500"> · {method.detail}</span>}
              </li>
            ))}
          </ul>
          {service.physicalLocation && <p className="mt-1 text-xs text-slate-500">{service.physicalLocation}</p>}
        </li>
      ))}
    </ul>
  );
}
