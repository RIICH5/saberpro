"use client";

import { ArrowUpDown } from "lucide-react";

interface TableProps {
  columns: {
    header: string;
    accessor: string;
    className?: string;
    sortable?: boolean;
  }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  onSort?: (accessor: string) => void;
  sortConfig?: { key: string | null; direction: "asc" | "desc" };
}

const Table = ({
  columns,
  renderRow,
  data,
  onSort,
  sortConfig,
}: TableProps) => {
  return (
    <div className="overflow-x-auto transition-all duration-300">
      <table className="w-full mt-4">
        <thead>
          <tr className="text-left text-saberPro-gray text-sm border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`p-3 ${col.className ?? ""} ${
                  col.sortable ? "cursor-pointer hover:bg-gray-50" : ""
                }`}
                onClick={() => col.sortable && onSort && onSort(col.accessor)}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && (
                    <ArrowUpDown
                      size={14}
                      className={`transition-all duration-200 ${
                        sortConfig?.key === col.accessor
                          ? "opacity-100" +
                            (sortConfig.direction === "desc"
                              ? " rotate-180"
                              : "")
                          : "opacity-50"
                      }`}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length > 0 ? (
            data.map((item) => renderRow(item))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-saberPro-gray animate-pulse"
              >
                No se encontraron resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
