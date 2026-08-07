'use client'

import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  DataTable,
  type DataTableColumnDef,
} from '@/components/ui/data-table'

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
  const tableColumns = useMemo<Array<DataTableColumnDef<T>>>(
    () =>
      columns.map((column) => ({
        id: String(column.key),
        accessorFn: (row) => row[column.key as keyof T],
        header: column.header,
        cell: ({ row }) =>
          column.render
            ? column.render(row.original)
            : String(row.original[column.key as keyof T] ?? ''),
      })),
    [columns],
  )

  return (
    <section className="flex flex-col gap-4" aria-busy={isLoading}>
      <DataTable
        className="hidden rounded-2xl border-slate-200 md:block dark:border-slate-800"
        caption={caption}
        columns={tableColumns}
        data={rows}
        emptyMessage={emptyMessage}
        getRowId={(row, index) => String(row.id ?? index)}
        headerClassName="bg-slate-50 dark:bg-slate-950"
      />

      <ul className="flex flex-col gap-3 md:hidden" aria-label={`${caption} mobile list`}>
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
              <dl className="flex flex-col gap-2">
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
