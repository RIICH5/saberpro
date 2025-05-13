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

type LessonType = {
  id: number;
  name: string;
  subject: SubjectType;
  class: ClassType;
  teacher: TeacherType;
};

type AssignmentType = {
  id: number;
  title: string;
  startDate: string | Date;
  dueDate: string | Date;
  lessonId: number;
  lesson: LessonType;
};

interface AssignmentListClientWrapperProps {
  initialData: AssignmentType[];
  userRole?: string;
  lessons: LessonType[];
  userId?: string | null;
}

const AssignmentListClientWrapper = ({
  initialData,
  userRole,
  lessons,
  userId,
}: AssignmentListClientWrapperProps) => {
  // State
  const [data, setData] = useState<AssignmentType[]>(initialData);
  const [filteredData, setFilteredData] =
    useState<AssignmentType[]>(initialData);
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
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Extract unique subjects, classes, and teachers from lessons
  const allSubjects = Array.from(
    new Map(
      lessons.map((lesson) => [lesson.subject.id, lesson.subject])
    ).values()
  );

  const allClasses = Array.from(
    new Map(lessons.map((lesson) => [lesson.class.id, lesson.class])).values()
  );

  const allTeachers = Array.from(
    new Map(
      lessons.map((lesson) => [lesson.teacher.id, lesson.teacher])
    ).values()
  );

  // Define columns
  const columns = [
    {
      header: "Título",
      accessor: "title",
      sortable: true,
    },
    {
      header: "Asignatura",
      accessor: "subject",
      className: "hidden sm:table-cell",
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
    {
      header: "Fecha de entrega",
      accessor: "dueDate",
      className: "hidden md:table-cell",
      sortable: true,
    },
    {
      header: "Estado",
      accessor: "status",
      className: "hidden sm:table-cell",
    },
    ...(userRole === "admin" || (userRole === "teacher" && userId)
      ? [
          {
            header: "Acciones",
            accessor: "action",
          },
        ]
      : []),
  ];

  // Format date
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calculate assignment status
  const getAssignmentStatus = (
    startDate: string | Date,
    dueDate: string | Date
  ) => {
    const now = new Date();
    const start = new Date(startDate);
    const due = new Date(dueDate);

    if (now < start) {
      return { status: "Pendiente", color: "bg-blue-100 text-blue-700" };
    } else if (now > due) {
      return { status: "Vencida", color: "bg-red-100 text-red-700" };
    } else {
      return { status: "En curso", color: "bg-green-100 text-green-700" };
    }
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

  // Toggle upcoming filter
  const toggleUpcoming = () => {
    setShowUpcoming(!showUpcoming);
    if (showOverdue && !showUpcoming) {
      setShowOverdue(false);
    }
  };

  // Toggle overdue filter
  const toggleOverdue = () => {
    setShowOverdue(!showOverdue);
    if (showUpcoming && !showOverdue) {
      setShowUpcoming(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setSelectedTeachers([]);
    setShowUpcoming(false);
    setShowOverdue(false);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Check if user can edit this assignment
  const canEditAssignment = (assignment: AssignmentType) => {
    if (userRole === "admin") return true;
    if (
      userRole === "teacher" &&
      userId &&
      assignment.lesson.teacher.id === userId
    )
      return true;
    return false;
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];
    const now = new Date();

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.lesson.subject.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.lesson.class.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          `${item.lesson.teacher.name} ${item.lesson.teacher.surname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply subject filter
    if (selectedSubjects.length > 0) {
      result = result.filter((item) =>
        selectedSubjects.includes(item.lesson.subject.id)
      );
    }

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter((item) =>
        selectedClasses.includes(item.lesson.class.id)
      );
    }

    // Apply teacher filter
    if (selectedTeachers.length > 0) {
      result = result.filter((item) =>
        selectedTeachers.includes(item.lesson.teacher.id)
      );
    }

    // Apply upcoming filter (assignments not yet started)
    if (showUpcoming) {
      result = result.filter((item) => new Date(item.startDate) > now);
    }

    // Apply overdue filter (assignments past due date)
    if (showOverdue) {
      result = result.filter((item) => new Date(item.dueDate) < now);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortConfig.key) {
          case "title":
            valueA = a.title;
            valueB = b.title;
            break;
          case "subject":
            valueA = a.lesson.subject.name;
            valueB = b.lesson.subject.name;
            break;
          case "dueDate":
            valueA = new Date(a.dueDate).getTime();
            valueB = new Date(b.dueDate).getTime();
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
    showUpcoming,
    showOverdue,
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
  const renderRow = (item: AssignmentType) => {
    const { status, color } = getAssignmentStatus(item.startDate, item.dueDate);

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
      >
        <td className="p-4">{item.title}</td>
        <td className="hidden sm:table-cell">{item.lesson.subject.name}</td>
        <td className="hidden md:table-cell">{item.lesson.class.name}</td>
        <td className="hidden lg:table-cell">
          {item.lesson.teacher.name} {item.lesson.teacher.surname}
        </td>
        <td className="hidden md:table-cell">{formatDate(item.dueDate)}</td>
        <td className="hidden sm:table-cell">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${color}`}>
            {status}
          </span>
        </td>
        {(userRole === "admin" || userRole === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              <Link href={`/list/assignments/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all duration-200">
                  <Eye size={16} />
                </button>
              </Link>
              {canEditAssignment(item) && (
                <>
                  <FormContainerClient
                    table="assignment"
                    type="update"
                    data={{
                      ...item,
                      startDate: new Date(item.startDate)
                        .toISOString()
                        .slice(0, 10),
                      dueDate: new Date(item.dueDate)
                        .toISOString()
                        .slice(0, 10),
                    }}
                    userRole={userRole}
                    relatedData={{ lessons }}
                    onComplete={refreshData}
                  />
                  <FormContainerClient
                    table="assignment"
                    type="delete"
                    id={item.id}
                    userRole={userRole}
                    onComplete={refreshData}
                  />
                </>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Todas las Tareas
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
              onClick={() => requestSort("dueDate")}
            >
              <ArrowDownUp
                size={14}
                className={`transition-transform duration-300 ${
                  sortConfig.key === "dueDate"
                    ? sortConfig.direction === "asc"
                      ? "rotate-0"
                      : "rotate-180"
                    : ""
                }`}
              />
            </button>
            {(userRole === "admin" || userRole === "teacher") && (
              <FormContainerClient
                table="assignment"
                type="create"
                userRole={userRole}
                relatedData={{ lessons }}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Filters */}
              <div>
                <h4 className="text-sm font-medium mb-3">Estado</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={toggleUpcoming}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      showUpcoming
                        ? "bg-blue-100 text-blue-700 border-blue-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={toggleOverdue}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      showOverdue
                        ? "bg-red-100 text-red-700 border-red-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Vencidas
                  </button>
                </div>
              </div>

              {/* Subject filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Asignaturas</h4>
                <div className="flex flex-wrap gap-2">
                  {allSubjects.map((subject) => (
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
                  {allClasses.map((classItem) => (
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
              {userRole === "admin" && (
                <div className="md:col-span-3">
                  <h4 className="text-sm font-medium mb-3">Profesores</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTeachers.map((teacher) => (
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
              )}
            </div>

            {/* Active filters summary */}
            {(selectedSubjects.length > 0 ||
              selectedClasses.length > 0 ||
              selectedTeachers.length > 0 ||
              showUpcoming ||
              showOverdue ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

                  {showUpcoming && (
                    <div className="flex items-center bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">
                      Pendientes
                      <button
                        onClick={toggleUpcoming}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {showOverdue && (
                    <div className="flex items-center bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md">
                      Vencidas
                      <button
                        onClick={toggleOverdue}
                        className="ml-1 text-red-400 hover:text-red-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {selectedSubjects.map((id) => {
                    const subject = allSubjects.find((s) => s.id === id);
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
                    const classItem = allClasses.find((c) => c.id === id);
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
                    const teacher = allTeachers.find((t) => t.id === id);
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

export default AssignmentListClientWrapper;
