"use client";

import {
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Core-only feature set shared by app data tables (TanStack Table v9). */
export const dataTableFeatures = tableFeatures({});

export type DataTableColumnDef<TData> = ColumnDef<
  typeof dataTableFeatures,
  TData
>;

interface DataTableProps<TData> {
  columns: Array<DataTableColumnDef<TData>>;
  data: TData[];
  caption?: string;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  getRowId?: (originalRow: TData, index: number) => string;
}

export function DataTable<TData>({
  columns,
  data,
  caption,
  emptyMessage = "No results.",
  className,
  tableClassName,
  headerClassName,
  getRowId,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("overflow-hidden rounded-md border", className)}>
      <Table className={tableClassName}>
        {caption ? (
          <TableCaption className="sr-only">{caption}</TableCaption>
        ) : null}
        <TableHeader className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 whitespace-normal text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
