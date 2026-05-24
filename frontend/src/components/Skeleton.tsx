/** Animates a single gray placeholder bar. className controls size. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />;
}

/** One shimmer row for use inside a <tbody>. cols controls how many cells. */
export function SkeletonTableRow({ cols }: { cols: number }) {
  const widths = ['w-3/4', 'w-2/3', 'w-1/2', 'w-3/5', 'w-1/3', 'w-2/5', 'w-1/4'];
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className={`h-4 animate-pulse bg-gray-200 rounded ${widths[i % widths.length]}`} />
        </td>
      ))}
    </tr>
  );
}

/** Mimics an Appointments-style stat card (big number + label, coloured top border). */
export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-gray-200">
      <div className="h-8 w-14 animate-pulse bg-gray-200 rounded mb-2" />
      <div className="h-3 w-36 animate-pulse bg-gray-200 rounded" />
    </div>
  );
}

/** Mimics a Doctors / StaffManagement card row. */
export function SkeletonPersonCard() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 animate-pulse bg-gray-200 rounded" />
            <div className="h-5 w-20 animate-pulse bg-gray-200 rounded-full" />
          </div>
          <div className="flex gap-1">
            {[10, 10, 10].map((_, i) => (
              <div key={i} className="h-5 w-10 animate-pulse bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <div className="h-7 w-7 animate-pulse bg-gray-200 rounded" />
          <div className="h-7 w-7 animate-pulse bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
