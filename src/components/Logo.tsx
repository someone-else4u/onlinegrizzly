import { GraduationCap, BookOpen } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-6 h-6", container: "w-8 h-8", text: "text-sm" },
    md: { icon: "w-8 h-8", container: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-12 h-12", container: "w-16 h-16", text: "text-2xl" },
  };

  const { icon, container, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${container} bg-primary rounded-xl flex items-center justify-center relative shadow-md`}>
        <GraduationCap className={`${icon} text-primary-foreground`} />
        <BookOpen className="w-3 h-3 text-accent absolute -bottom-0.5 -right-0.5 drop-shadow-sm" />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-display font-bold text-foreground ${text}`}>
            GRIZZLY INTEGRATED
          </span>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            Academy
          </span>
        </div>
      )}
    </div>
  );
}
