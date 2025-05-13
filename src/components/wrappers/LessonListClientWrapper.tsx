"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowDownUp, Eye, X } from "lucide-react";
import Link from "next/link";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

// Define types
type SubjectType = {
  id: number;
  name: string;
};

type ClassType = {
  id: number;
  name: string;
};

type TeacherType = {
  id: string;
  name: string;
  surname: string;
};

type DayType = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

type LessonType = {
  id: number;
  name: string;
  day: DayType;
  startTime: string | Date;
  endTime: string | Date;
  subjectId: number;
  classId: number;
  teacherId: string;
  subject: { name: string };
  class: { name: string };
  teacher: { name: string; surname: string };
};

interface LessonListClientWrapperProps {
  initialData: LessonType[];
  userRole?: string;
  subjects: SubjectType[];
  classes: ClassType[];
  teachers: TeacherType[];
}

const LessonListClientWrapper = ({
  initialData,
  userRole,
  subjects,
  classes,
  teachers,
}: LessonListClientWrapperProps) => {
  // State
  const [data, setData] = useState<LessonType[]>(initialData);
  const [filteredData, setFilteredData] = useState<LessonType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayType[]>([]);
  const ITEMS_PER_PAGE = 10;

  // Days translation map
  const daysTranslation: Record<DayType, string> = {
    MONDAY: "Lunes",
    TUESDAY: "Martes",
    WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves",
    FRIDAY: "Viernes",
  };

  // All available days
  const allDays: DayType[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

  // Define columns
  const columns = [
    {
      header: "Nombre",
      accessor: "name",
      sortable: true,
    },
    {
      header: "Día",
      accessor: "day",
      className: "hidden sm:table-cell",
      sortable: true,
    },
    {
      header: "Hora",
      accessor: "time",
      className: "hidden sm:table-cell",
    },
    {
      header: "Asignatura",
      accessor: "subject",
      className: "hidden md:table-cell",
      sortable: true,
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Profesor",
      accessor: "teacher",
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

  // Format time
  const formatTime = (date: string | Date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort function
  const requestSort = (key: string) => {
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

  // Toggle subject selection
  const toggleSubject = (subjectId: number) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  // Toggle class selection
  const toggleClass = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  // Toggle teacher selection
  const toggleTeacher = (teacherId: string) => {
    if (selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(selectedTeachers.filter((id) => id !== teacherId));
    } else {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    }
  };

  // Toggle day selection
  const toggleDay = (day: DayType) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setSelectedTeachers([]);
    setSelectedDays([]);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.class.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${item.teacher.name} ${item.teacher.surname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply subject filter
    if (selectedSubjects.length > 0) {
      result = result.filter((item) =>
        selectedSubjects.includes(item.subjectId)
      );
    }

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter((item) => selectedClasses.includes(item.classId));
    }

    // Apply teacher filter
    if (selectedTeachers.length > 0) {
      result = result.filter((item) =>
        selectedTeachers.includes(item.teacherId)
      );
    }

    // Apply day filter
    if (selectedDays.length > 0) {
      result = result.filter((item) => selectedDays.includes(item.day));
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortConfig.key) {
          case "name":
            valueA = a.name;
            valueB = b.name;
            break;
          case "day":
            // Order by day of week (Monday=1, Friday=5)
            const dayOrder: Record<DayType, number> = {
              MONDAY: 1,
              TUESDAY: 2,
              WEDNESDAY: 3,
              THURSDAY: 4,
              FRIDAY: 5,
            };
            valueA = dayOrder[a.day];
            valueB = dayOrder[b.day];
            break;
          case "subject":
            valueA = a.subject.name;
            valueB = b.subject.name;
            break;
          default:
            return 0;
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortConfig.direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc"
            ? valueA - valueB
            : valueB - valueA;
        }

        return 0;
      });
    }

    setFilteredData(result);
  }, [
    data,
    searchQuery,
    sortConfig,
    selectedSubjects,
    selectedClasses,
    selectedTeachers,
    selectedDays,
  ]);

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

  // Render table row
  const renderRow = (item: LessonType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
    >
      <td className="p-4">{item.name}</td>
      <td className="hidden sm:table-cell">{daysTranslation[item.day]}</td>
      <td className="hidden sm:table-cell">
        {formatTime(item.startTime)} - {formatTime(item.endTime)}
      </td>
      <td className="hidden md:table-cell">{item.subject.name}</td>
      <td className="hidden md:table-cell">{item.class.name}</td>
      <td className="hidden lg:table-cell">
        {item.teacher.name} {item.teacher.surname}
      </td>
      {userRole === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainerClient
              table="lesson"
              type="update"
              data={{
                ...item,
                startTime: new Date(item.startTime).toISOString().slice(0, 16),
                endTime: new Date(item.endTime).toISOString().slice(0, 16),
              }}
              userRole={userRole}
              relatedData={{ subjects, classes, teachers }}
              onComplete={refreshData}
            />
            <FormContainerClient
              table="lesson"
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
          Todas las Lecciones
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
                table="lesson"
                type="create"
                userRole={userRole}
                relatedData={{ subjects, classes, teachers }}
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
              {/* Day filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Días</h4>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedDays.includes(day)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {daysTranslation[day]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Asignaturas</h4>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedSubjects.includes(subject.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Clases</h4>
                <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Teacher filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Profesores</h4>
                <div className="flex flex-wrap gap-2">
                  {teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => toggleTeacher(teacher.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedTeachers.includes(teacher.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {teacher.name} {teacher.surname}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(selectedSubjects.length > 0 ||
              selectedClasses.length > 0 ||
              selectedTeachers.length > 0 ||
              selectedDays.length > 0 ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

                  {selectedDays.map((day) => (
                    <div
                      key={`selected-day-${day}`}
                      className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                    >
                      {daysTranslation[day]}
                      <button
                        onClick={() => toggleDay(day)}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {selectedSubjects.map((id) => {
                    const subject = subjects.find((s) => s.id === id);
                    return subject ? (
                      <div
                        key={`selected-subject-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {subject.name}
                        <button
                          onClick={() => toggleSubject(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}

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

                  {selectedTeachers.map((id) => {
                    const teacher = teachers.find((t) => t.id === id);
                    return teacher ? (
                      <div
                        key={`selected-teacher-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {teacher.name} {teacher.surname}
                        <button
                          onClick={() => toggleTeacher(id)}
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
        onSort={requestSort}
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

export default LessonListClientWrapper;
