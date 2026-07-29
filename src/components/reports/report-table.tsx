'use client'

import { Button } from '@/components/ui/button'

interface ReportTableColumn<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => string
}

interface ReportTableProps<T extends { id?: string | number }> {
  caption: string
  columns: ReportTableColumn<T>[]
  rows: T[]
  emptyMessage?: string
  nextCursor?: string | null
  onNextPage?: (cursor: string) => void
  isLoading?: boolean
}

export function ReportTable<T extends Record<string, unknown>>({
  caption,
  columns,
  rows,
  emptyMessage = 'No records found for the selected filters.',
  nextCursor,
  onNextPage,
  isLoading = false,
}: ReportTableProps<T>) {
  return (
    <section className="space-y-4" aria-busy={isLoading}>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
        <table className="min-w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} scope="col" className="px-4 py-3 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={String(row.id ?? index)}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 align-top">
                      {column.render
                        ? column.render(row)
                        : String(row[column.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={`${caption} mobile list`}>
        {rows.length === 0 ? (
          <li className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            {emptyMessage}
          </li>
        ) : (
          rows.map((row, index) => (
            <li
              key={String(row.id ?? index)}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <dl className="space-y-2">
                {columns.map((column) => (
                  <div key={String(column.key)} className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {column.header}
                    </dt>
                    <dd className="text-right text-sm font-medium">
                      {column.render
                        ? column.render(row)
                        : String(row[column.key as keyof T] ?? '')}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))
        )}
      </ul>

      {nextCursor && onNextPage ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onNextPage(nextCursor)}>
            Next page
          </Button>
        </div>
      ) : null}
    </section>
  )
}
