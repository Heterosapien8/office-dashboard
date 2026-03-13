export default function MapLegend({ showHeatmap, className = '' }) {
  return (
    <div className={`${className} max-w-[160px] rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-xs shadow-[0_18px_50px_-28px_rgba(15,23,42,0.65)] backdrop-blur`}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Legend</p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span>Good (AQI 0-100)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Moderate (AQI 101-200)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          <span>Poor (AQI 201-300)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
            <span className="absolute inline-flex h-5 w-5 rounded-full border border-red-400/60" />
          </span>
          <span>Violation</span>
        </div>
      </div>

      {showHeatmap && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="mb-2 h-2.5 rounded-full bg-[linear-gradient(90deg,#3b82f6_0%,#06b6d4_25%,#84cc16_50%,#f97316_75%,#ef4444_100%)]" />
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            <span>Clean</span>
            <span>Limit</span>
            <span>Violation</span>
          </div>
        </div>
      )}
    </div>
  )
}
