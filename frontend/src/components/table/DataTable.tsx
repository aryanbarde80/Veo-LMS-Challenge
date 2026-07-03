import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download, Filter } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  cell?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      data,
      columns,
      onRowClick,
      pagination = true,
      pageSize = 10,
      sortable = true,
      selectable = true,
      onSelectionChange,
      actions,
      isLoading = false,
      emptyMessage = 'No data available',
    },
    ref
  ) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

    const sortedData = useMemo(() => {
      let sorted = [...data];

      if (sortColumn && sortable) {
        sorted.sort((a, b) => {
          const aValue = typeof sortColumn === 'string' ? a[sortColumn] : sortColumn(a);
          const bValue = typeof sortColumn === 'string' ? b[sortColumn] : sortColumn(b);

          if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return sorted;
    }, [data, sortColumn, sortDirection, sortable]);

    const paginatedData = useMemo(() => {
      if (!pagination) return sortedData;

      const start = (currentPage - 1) * pageSize;
      return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, pagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (column: Column<any>) => {
      if (!sortable || !column.sortable) return;

      const columnName = typeof column.accessor === 'string' ? column.accessor : column.header;

      if (sortColumn === columnName) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(columnName);
        setSortDirection('asc');
      }
    };

    const handleSelectAll = () => {
      if (selectedRows.size === paginatedData.length) {
        setSelectedRows(new Set());
      } else {
        setSelectedRows(new Set(paginatedData));
      }
    };

    const handleSelectRow = (row: any) => {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(row)) {
        newSelected.delete(row);
      } else {
        newSelected.add(row);
      }
      setSelectedRows(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    };

    const getValue = (row: any, column: Column<any>) => {
      const accessor = column.accessor;
      return typeof accessor === 'function' ? accessor(row) : row[accessor];
    };

    return (
      <div ref={ref} className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#2E2E4A]">
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(column)}
                  className={`px-4 py-3 text-left text-[#9B98B8] font-semibold ${
                    sortable && column.sortable ? 'cursor-pointer hover:text-white' : ''
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {sortable && column.sortable && sortColumn === column.header && (
                      <>
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6C47FF]"></div>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-[#9B98B8]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-[#2E2E4A] hover:bg-[#1A1A2E] transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row)}
                        onChange={() => handleSelectRow(row)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-[#F0EFF8]">
                      {column.cell
                        ? column.cell(getValue(row, column), row)
                        : getValue(row, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-[#0A0E27] rounded-lg">
            <div className="text-[#9B98B8] text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#1A1A2E] hover:bg-[#2E2E4A] text-[#9B98B8] rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#1A1A2E] hover:bg-[#2E2E4A] text-[#9B98B8] rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';

export default DataTable;
