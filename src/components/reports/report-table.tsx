'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    <section className="flex flex-col gap-4" aria-busy={isLoading}>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader className="bg-slate-50 dark:bg-slate-950">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-4 py-6 whitespace-normal text-slate-500"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={String(row.id ?? index)}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className="px-4 py-3 align-top whitespace-normal"
                    >
                      {column.render
                        ? column.render(row)
                        : String(row[column.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
