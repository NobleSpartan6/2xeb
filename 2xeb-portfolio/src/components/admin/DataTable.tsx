import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchFields?: (keyof T)[];
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  onEdit,
  onDelete,
  isLoading = false,
  emptyMessage = 'No data found',
  searchable = true,
  searchFields = [],
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(null);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const fieldsToSearch = searchFields.length > 0 ? searchFields : (Object.keys(item) as (keyof T)[]);
      return fieldsToSearch.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (Array.isArray(value)) {
          return value.some((v) => String(v).toLowerCase().includes(query));
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn as keyof T];
      const bVal = b[sortColumn as keyof T];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (item: T) => {
    setDeleteConfirm(item);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm && onDelete) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-[#525252] font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchable && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 pl-10 bg-[#0A0A0A] border border-[#262626] text-white font-mono text-sm placeholder-[#525252] focus:outline-none focus:border-[#2563EB] transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-[#262626]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0A0A0A] border-b border-[#262626]">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[#525252] font-mono ${
                    column.sortable !== false ? 'cursor-pointer hover:text-[#a3a3a3]' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && sortColumn === String(column.key) && (
                      <svg
                        className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-[#525252] font-mono w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-[#525252] font-mono"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr
                  key={String(item[keyField])}
                  className="border-b border-[#1f2937] hover:bg-[#0A0A0A]/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-[#a3a3a3] font-mono"
                    >
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-[#525252] hover:text-[#2563EB] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-[#525252] hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="text-xs text-[#525252] font-mono">
        {filteredData.length} of {data.length} items
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0A0A0A] border border-[#262626] p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-space-grotesk font-semibold text-white mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-[#737373] font-mono mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-mono text-[#a3a3a3] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
