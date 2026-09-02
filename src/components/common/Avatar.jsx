import { initials, avatarColor } from "../../utils/formatters";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export default function Avatar({ name, src = "", size = "md", className = "" }) {
  const sizeClass = SIZES[size] || SIZES.md;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover ring-1 ring-slate-200 ${sizeClass} ${className}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatarColor(name)} ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}