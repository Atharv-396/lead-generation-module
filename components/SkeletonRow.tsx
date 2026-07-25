interface SkeletonRowProps {
  columns: number;
}

export default function SkeletonRow({ columns }: SkeletonRowProps) {
  return (
    <tr aria-busy="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}
