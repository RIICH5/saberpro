"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  ArrowDownUp,
  ChevronDown,
  UserRound,
  Eye,
  BookOpen,
  Shapes,
  X,
} from "lucide-react";
import Link from "next/link";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

type ClassType = {
  id: number;
  name: string;
};

type GradeType = {
  id: number;
  level: number;
};

type StudentType = {
  id: string;
  name: string;
  surname: string;
  username: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  birthday: Date;
  sex: "MALE" | "FEMALE";
  grade: GradeType;
  class: ClassType;
  parentId?: string;
};

interface StudentListClientWrapperProps {
  initialData: StudentType[];
  userRole?: string;
  classes: ClassType[];
  grades: GradeType[];
}

const StudentListClientWrapper = ({
  initialData,
  userRole,
  classes,
  grades,
}: StudentListClientWrapperProps) => {
  // State
  const [data, setData] = useState<StudentType[]>(initialData);
  const [filteredData, setFilteredData] = useState<StudentType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StudentType | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const ITEMS_PER_PAGE = 10;

  // Define columns
  const columns = [
    {
      header: "Información",
      accessor: "info",
    },
    {
      header: "ID Estudiante",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Semestre",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Teléfono",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Dirección",
      accessor: "address",
      className: "hidden lg:table-cell",
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
  const requestSort = (key: keyof StudentType) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Toggle filters
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Toggle selection for classes
  const toggleClass = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  // Toggle selection for grades
  const toggleGrade = (gradeId: number) => {
    if (selectedGrades.includes(gradeId)) {
      setSelectedGrades(selectedGrades.filter((id) => id !== gradeId));
    } else {
      setSelectedGrades([...selectedGrades, gradeId]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedClasses([]);
    setSelectedGrades([]);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by classes
    if (selectedClasses.length > 0) {
      result = result.filter((item) => selectedClasses.includes(item.class.id));
    }

    // Filter by grades
    if (selectedGrades.length > 0) {
      result = result.filter((item) => selectedGrades.includes(item.grade.id));
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
  }, [data, searchQuery, sortConfig, selectedClasses, selectedGrades]);

  // Pagination
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

  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  // Render each row
  const renderRow = (item: StudentType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {item.img ? (
            <img
              src={item.img}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserRound size={24} className="text-gray-500" />
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item.class.name}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">Clase {item.grade.level}</td>
      <td className="hidden md:table-cell">{item.class.name}</td>
      <td className="hidden lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden lg:table-cell">{item.address}</td>
      {userRole === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/students/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200">
                <Eye size={16} />
              </button>
            </Link>
            <FormContainerClient
              table="student"
              type="delete"
              id={item.id}
              studentInfo={{
                name: `${item.name} ${item.surname}`,
                username: item.username,
              }}
              userRole={userRole}
              relatedData={{ classes, grades }}
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
          Todos los Estudiantes
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
                table="student"
                type="create"
                userRole={userRole}
                relatedData={{ classes, grades }}
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
              {/* Classes filter */}
              <details className="group" open>
                <summary className="text-sm font-medium mb-3 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <Shapes size={14} />
                    <span>Clases</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <div className="pl-6">
                  {classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {classes.map((classItem) => (
                        <button
                          key={classItem.id}
                          onClick={() => toggleClass(classItem.id)}
                          className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                            selectedClasses.includes(classItem.id)
                              ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {classItem.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No hay clases disponibles
                    </p>
                  )}
                </div>
              </details>

              {/* Grades filter */}
              <details className="group" open>
                <summary className="text-sm font-medium mb-3 flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} />
                    <span>Semestre</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <div className="pl-6">
                  {grades.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                          Semestres {grade.level}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No hay semestres disponibles
                    </p>
                  )}
                </div>
              </details>
            </div>

            {/* Active filters summary */}
            {(selectedClasses.length > 0 || selectedGrades.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>
                  {selectedClasses.map((id) => {
                    const classItem = classes.find((c) => c.id === id);
                    return classItem ? (
                      <div
                        key={`selected-class-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {classItem.name}
                        <button
                          onClick={() => toggleClass(id)}
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
                        Semestre {grade.level}
                        <button
                          onClick={() => toggleGrade(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={paginatedData} />

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

export default StudentListClientWrapper;
