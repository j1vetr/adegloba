import * as React from "react"
import { cn } from "@/lib/utils"

interface DataTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
}

export function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn(
          "w-full caption-bottom text-sm bg-card text-card-foreground",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

interface DataTableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: React.ReactNode
}

export function DataTableHeader({ className, children, ...props }: DataTableHeaderProps) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-white bg-card/50 border-b border-border [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

interface DataTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
}

export function DataTableRow({ className, children, ...props }: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-primary/10 data-[state=selected]:bg-muted text-white",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

interface DataTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
}

export function DataTableCell({ className, children, ...props }: DataTableCellProps) {
  return (
    <td
      className={cn(
        "p-4 align-middle text-white [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}