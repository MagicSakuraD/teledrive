import { CircleCheck } from "lucide-react";

interface formSuccessProps {
  mesaage?: string;
}

export const FormSuccess = ({ mesaage }: formSuccessProps) => {
  if (!mesaage) return null;
  return (
    <div
      className="flex items-center gap-x-2 text-emerald-500 bg-emerald-500/20
    p-3 rounded-md"
    >
      <CircleCheck className="h-4 w-4" />

      <p>{mesaage}</p>
    </div>
  );
};
