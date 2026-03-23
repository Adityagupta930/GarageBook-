export function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3].map(i => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ErrorRow({ cols, msg }: { cols: number; msg: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center text-red-500 py-5 text-sm">
        ⚠️ {msg}
      </td>
    </tr>
  );
}

export function EmptyRow({ cols, msg }: { cols: number; msg: string }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center text-gray-400 py-8 text-sm">
        {msg}
      </td>
    </tr>
  );
}
