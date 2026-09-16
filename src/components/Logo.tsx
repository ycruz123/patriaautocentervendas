import clsx from "clsx";

/**
 * Wordmark tipográfico da Base One (BASE em branco, ONE em dourado),
 * reconstruído em código a partir do brandboard da marca — sem depender de
 * um arquivo de logo importado.
 */
export function Logo({
  size = "md",
  showTagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}) {
  const textSize = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" }[size];

  return (
    <div className={clsx("flex flex-col", className)}>
      <div className={clsx("flex items-baseline font-bold leading-none tracking-tight", textSize)}>
        <span className="text-white">BASE</span>
        <span className="ml-1.5 text-gold-500">ONE</span>
      </div>
      {showTagline && (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-300">
          Estratégia · Marca · Resultados
        </p>
      )}
    </div>
  );
}

/** Versão compacta (marca "B1") para a sidebar recolhida. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/30 bg-ink-950 font-bold text-white",
        className
      )}
    >
      B<span className="text-gold-500">1</span>
    </div>
  );
}
