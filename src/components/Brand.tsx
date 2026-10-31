import { Sprout } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Sprout size={23} strokeWidth={1.4} />
      </span>
      planora<span className="brand-ai">AI</span>
    </span>
  );
}
