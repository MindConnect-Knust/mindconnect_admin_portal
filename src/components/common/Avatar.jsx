import { initials, avatarColor } from "../../utils/formatters";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export default function Avatar({ name, size = "md", className = "" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatarColor(name)} ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
