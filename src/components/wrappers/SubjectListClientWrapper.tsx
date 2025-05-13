"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, ArrowDownUp, X, Eye } from "lucide-react";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

// Define types
type TeacherType = {
  id: string;
  name: string;
  email?: string;
  username: string;
};

type SubjectType = {
  id: number;
  name: string;
  teachers: TeacherType[];
};

interface SubjectListClientWrapperProps {
  initialData: SubjectType[];
  userRole?: string;
  count: number;
  teachers: TeacherType[];
}

const SubjectListClientWrapper = ({
  initialData,
  userRole,
  count,
  teachers,
}: SubjectListClientWrapperProps) => {
  // State
  const [data, setData] = useState<SubjectType[]>(initialData);
  const [filteredData, setFilteredData] = useState<SubjectType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SubjectType | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Define columns
  const columns = [
    {
      header: "Nombre",
      accessor: "name",
      sortable: true,
    },
    {
      header: "Maestros",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    {
      header: "Acciones",
      accessor: "action",
    },
  ];

  // Sort function
  const requestSort = (key: keyof SubjectType) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === "name") {
          return sortConfig.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        return 0;
      });
    }

    setFilteredData(result);
  }, [data, searchQuery, sortConfig]);

  // Calculate pagination
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Refresh data after operations
  const refreshData = () => {
    setData(initialData);
    setFilteredData(initialData);
    setPage(1);
  };

  // Effect to set initial data
  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  // Render table row
  const renderRow = (item: SubjectType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="p-4">{item.name}</td>
      <td className="hidden md:table-cell">
        {item.teachers.map((teacher) => teacher.name).join(", ")}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {userRole === "admin" && (
            <>
              <FormContainerClient
                table="subject"
                type="update"
                data={item}
                relatedData={{ teachers }}
                onComplete={refreshData}
              />
              <FormContainerClient
                table="subject"
                type="delete"
                id={item.id}
                relatedData={{ teachers }}
                onComplete={refreshData}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Todas las Asignaturas
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} initialQuery={searchQuery} />
          <div className="flex items-center gap-4 self-end">
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                showFilters ? "bg-gray-200" : "bg-gray-100"
              } text-gray-500 hover:bg-gray-200 transition-all duration-200`}
              onClick={toggleFilters}
            >
              <SlidersHorizontal
                size={14}
                className={`transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200"
              onClick={() => requestSort("name")}
            >
              <ArrowDownUp
                size={14}
                className={`transition-transform duration-300 ${
                  sortConfig.key === "name"
                    ? sortConfig.direction === "asc"
                      ? "rotate-0"
                      : "rotate-180"
                    : ""
                }`}
              />
            </button>
            {userRole === "admin" && (
              <FormContainerClient
                table="subject"
                type="create"
                userRole={userRole}
                relatedData={{ teachers }}
                onComplete={refreshData}
              />
            )}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-sm border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <SlidersHorizontal size={14} />
              Filtros Activos
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1"
            >
              <X size={12} />
              Limpiar Filtros
            </button>
          </div>

          <div className="bg-white p-4">
            {/* Add filter options here if needed */}
            <p className="text-sm text-gray-500">
              {searchQuery
                ? `Buscar: "${searchQuery}"`
                : "No hay filtros activos"}
            </p>
          </div>
        </div>
      )}

      {/* LIST */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={paginatedData}
        onSort={requestSort as any}
        sortConfig={sortConfig}
      />

      {/* PAGINATION */}
      <Pagination
        page={page}
        count={filteredData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
};

export default SubjectListClientWrapper;
