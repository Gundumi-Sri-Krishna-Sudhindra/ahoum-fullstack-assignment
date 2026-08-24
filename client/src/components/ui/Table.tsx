import type React from 'react'

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div
      className={`w-full overflow-x-auto border border-slate-200 rounded-sm shadow-sm ${containerClassName}`}
    >
      <table
        className={`w-full text-left text-base border-collapse bg-white ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody
      className={`divide-y divide-slate-200 bg-white ${className}`}
      {...props}
    >
      {children}
    </tbody>
  )
}

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-slate-50/80 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      className={`py-4 px-6 font-bold text-slate-800 text-xs tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`py-4 px-6 text-slate-900 font-normal ${className}`} {...props}>
      {children}
    </td>
  )
}
