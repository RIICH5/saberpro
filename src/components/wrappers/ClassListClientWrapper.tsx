"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowDownUp, Eye, X } from "lucide-react";
import Link from "next/link";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

// Define types
type TeacherType = {
  id: string;
  name: string;
  surname: string;
};

type GradeType = {
  id: number;
  level: number;
};

type ClassType = {
  id: number;
  name: string;
  capacity: number;
  gradeId: number;
  supervisorId?: string;
  supervisor?: TeacherType;
  grade?: GradeType;
};

interface ClassListClientWrapperProps {
  initialData: ClassType[];
  userRole?: string;
  teachers: TeacherType[];
  grades: GradeType[];
}

const ClassListClientWrapper = ({
  initialData,
  userRole,
  teachers,
  grades,
}: ClassListClientWrapperProps) => {
  // State
  const [data, setData] = useState<ClassType[]>(initialData);
  const [filteredData, setFilteredData] = useState<ClassType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ClassType | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const ITEMS_PER_PAGE = 10;

  // Define columns
  const columns = [
    {
      header: "Nombre de Clase",
      accessor: "name",
      sortable: true,
    },
    {
      header: "Capacidad",
      accessor: "capacity",
      className: "hidden md:table-cell",
      sortable: true,
    },
    {
      header: "Clase",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Supervisor",
      accessor: "supervisor",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin"
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Sort function
  const requestSort = (key: keyof ClassType) => {
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

  // Toggle supervisor selection
  const toggleSupervisor = (supervisorId: string) => {
    if (selectedSupervisors.includes(supervisorId)) {
      setSelectedSupervisors(
        selectedSupervisors.filter((id) => id !== supervisorId)
      );
    } else {
      setSelectedSupervisors([...selectedSupervisors, supervisorId]);
    }
  };

  // Toggle grade selection
  const toggleGrade = (gradeId: number) => {
    if (selectedGrades.includes(gradeId)) {
      setSelectedGrades(selectedGrades.filter((id) => id !== gradeId));
    } else {
      setSelectedGrades([...selectedGrades, gradeId]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSupervisors([]);
    setSelectedGrades([]);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
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

    // Apply supervisor filter
    if (selectedSupervisors.length > 0) {
      result = result.filter(
        (item) =>
          item.supervisorId && selectedSupervisors.includes(item.supervisorId)
      );
    }

    // Apply grade filter
    if (selectedGrades.length > 0) {
      result = result.filter((item) => selectedGrades.includes(item.gradeId));
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === "name") {
          return sortConfig.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === "capacity") {
          return sortConfig.direction === "asc"
            ? a.capacity - b.capacity
            : b.capacity - a.capacity;
        }
        return 0;
      });
    }

    setFilteredData(result);
  }, [data, searchQuery, sortConfig, selectedSupervisors, selectedGrades]);

  // Calculate pagination
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Refresh data after operations
  const refreshData = useCallback(() => {
    setData(initialData);
    setFilteredData(initialData);
    setPage(1);
  }, [initialData]);

  // Effect to set initial data
  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  // Get grade level by id
  const getGradeLevel = (gradeId: number) => {
    const grade = grades.find((g) => g.id === gradeId);
    return grade ? grade.level : "-";
  };

  // Render table row
  const renderRow = (item: ClassType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="p-4">{item.name}</td>
      <td className="hidden md:table-cell">{item.capacity}</td>
      <td className="hidden md:table-cell">{getGradeLevel(item.gradeId)}</td>
      <td className="hidden md:table-cell">
        {item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : "-"}
      </td>
      {userRole === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainerClient
              table="class"
              type="update"
              data={{
                ...item,
                gradeId: item.gradeId.toString(),
                supervisorId: item.supervisorId || "",
              }}
              userRole={userRole}
              relatedData={{ teachers, grades }}
              onComplete={refreshData}
            />
            <FormContainerClient
              table="class"
              type="delete"
              id={item.id}
              userRole={userRole}
              onComplete={refreshData}
            />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Todas las Clases
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
                table="class"
                type="create"
                userRole={userRole}
                relatedData={{ teachers, grades }}
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
              Filtros activos
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          </div>

          <div className="bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supervisors filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Supervisores</h4>
                <div className="flex flex-wrap gap-2">
                  {teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => toggleSupervisor(teacher.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedSupervisors.includes(teacher.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {teacher.name} {teacher.surname}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grades filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Clases</h4>
                <div className="flex flex-wrap gap-2">
                  {grades.map((grade) => (
                    <button
                      key={grade.id}
                      onClick={() => toggleGrade(grade.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedGrades.includes(grade.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      Clase {grade.level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(selectedSupervisors.length > 0 ||
              selectedGrades.length > 0 ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

                  {selectedSupervisors.map((id) => {
                    const teacher = teachers.find((t) => t.id === id);
                    return teacher ? (
                      <div
                        key={`selected-sup-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {teacher.name} {teacher.surname}
                        <button
                          onClick={() => toggleSupervisor(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}

                  {selectedGrades.map((id) => {
                    const grade = grades.find((g) => g.id === id);
                    return grade ? (
                      <div
                        key={`selected-grade-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        Grado {grade.level}
                        <button
                          onClick={() => toggleGrade(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}

                  {searchQuery && (
                    <div className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                      Búsqueda: {searchQuery}
                      <button
                        onClick={() => handleSearch("")}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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

export default ClassListClientWrapper;
