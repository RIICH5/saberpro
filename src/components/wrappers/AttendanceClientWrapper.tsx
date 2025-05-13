"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  ArrowDownUp,
  X,
  Calendar,
  Check,
  XCircle,
  PlusCircle,
} from "lucide-react";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";
import { useFormState } from "react-dom";
import { bulkCreateAttendance } from "@/lib/attendanceActions";
import { toast } from "react-toastify";

// Define types
interface StudentType {
  id: string;
  name: string;
  surname: string;
  class: {
    id: number;
    name: string;
  };
}

interface TeacherType {
  id: string;
  name: string;
  surname: string;
}

interface SubjectType {
  id: number;
  name: string;
}

interface ClassType {
  id: number;
  name: string;
}

interface LessonType {
  id: number;
  name: string;
  day: string;
  startTime: string | Date;
  endTime: string | Date;
  subject: SubjectType;
  class: ClassType;
  teacher: TeacherType;
  students?: StudentType[];
}

interface AttendanceType {
  id: number;
  date: string | Date;
  present: boolean;
  studentId: string;
  student: StudentType;
  lessonId: number;
  lesson: LessonType;
}

interface AttendanceListClientWrapperProps {
  initialData: AttendanceType[];
  userRole?: string;
  lessons: LessonType[];
  students: StudentType[];
  userId?: string | null;
}

const AttendanceListClientWrapper = ({
  initialData,
  userRole,
  lessons,
  students,
  userId,
}: AttendanceListClientWrapperProps) => {
  // State
  const [data, setData] = useState<AttendanceType[]>(initialData);
  const [filteredData, setFilteredData] =
    useState<AttendanceType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [selectedBulkLesson, setSelectedBulkLesson] = useState<number | null>(
    null
  );
  const [selectedBulkDate, setSelectedBulkDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [studentAttendances, setStudentAttendances] = useState<
    Map<string, boolean>
  >(new Map());
  const ITEMS_PER_PAGE = 10;

  // Initialize form state for bulk creation
  const [bulkFormState, bulkFormAction] = useFormState(bulkCreateAttendance, {
    success: false,
    error: false,
  });

  // Extract unique sets
  const allLessons = Array.from(
    new Map(
      initialData.map((attendance) => [attendance.lesson.id, attendance.lesson])
    ).values()
  );

  const allClasses = Array.from(
    new Map(
      initialData.map((attendance) => [
        attendance.lesson.class.id,
        attendance.lesson.class,
      ])
    ).values()
  );

  const allStudents = Array.from(
    new Map(
      initialData.map((attendance) => [
        attendance.student.id,
        attendance.student,
      ])
    ).values()
  );

  // Define columns
  const columns = [
    {
      header: "Fecha",
      accessor: "date",
      sortable: true,
    },
    {
      header: "Estudiante",
      accessor: "student",
      sortable: true,
    },
    {
      header: "Estado",
      accessor: "status",
      className: "text-center",
    },
    {
      header: "Lección",
      accessor: "lesson",
      className: "hidden md:table-cell",
    },
    {
      header: "Asignatura",
      accessor: "subject",
      className: "hidden lg:table-cell",
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden lg:table-cell",
    },
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

  // Handle bulk form submission
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBulkLesson) {
      toast.error("Debe seleccionar una lección");
      return;
    }

    const attendances = Array.from(studentAttendances.entries()).map(
      ([studentId, present]) => ({
        studentId,
        present,
      })
    );

    if (attendances.length === 0) {
      toast.error("No hay estudiantes seleccionados");
      return;
    }

    const formData = {
      date: selectedBulkDate,
      lessonId: selectedBulkLesson,
      attendances,
    };

    bulkFormAction(formData);
  };

  // Effect for handling bulk form state
  useEffect(() => {
    if (bulkFormState.success) {
      toast.success("Asistencias registradas con éxito");
      setShowBulkForm(false);
      refreshData();
    } else if (bulkFormState.error) {
      toast.error(
        bulkFormState.message ||
          "Error al registrar asistencias. Por favor, inténtalo de nuevo."
      );
    }
  }, [bulkFormState]);

  // Effect for handling bulk lesson selection
  useEffect(() => {
    if (selectedBulkLesson) {
      const lesson = lessons.find((l) => l.id === selectedBulkLesson);
      if (lesson && lesson.students) {
        const newAttendances = new Map<string, boolean>();

        lesson.students.forEach((student) => {
          newAttendances.set(student.id, true); // Default to present
        });

        setStudentAttendances(newAttendances);
      }
    } else {
      setStudentAttendances(new Map());
    }
  }, [selectedBulkLesson, lessons]);

  // Toggle student attendance in bulk form
  const toggleStudentAttendance = (studentId: string) => {
    const newAttendances = new Map(studentAttendances);

    if (newAttendances.has(studentId)) {
      newAttendances.set(studentId, !newAttendances.get(studentId));
    } else {
      newAttendances.set(studentId, true);
    }

    setStudentAttendances(newAttendances);
  };

  // Mark all students as present/absent
  const markAllStudents = (present: boolean) => {
    const newAttendances = new Map(studentAttendances);

    // Update all existing entries
    newAttendances.forEach((_, key) => {
      newAttendances.set(key, present);
    });

    setStudentAttendances(newAttendances);
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

  // Toggle lesson selection
  const toggleLesson = (lessonId: number) => {
    if (selectedLessons.includes(lessonId)) {
      setSelectedLessons(selectedLessons.filter((id) => id !== lessonId));
    } else {
      setSelectedLessons([...selectedLessons, lessonId]);
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

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Toggle status selection
  const toggleStatus = (status: string) => {
    if (selectedStatus.includes(status)) {
      setSelectedStatus(selectedStatus.filter((s) => s !== status));
    } else {
      setSelectedStatus([...selectedStatus, status]);
    }
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDate("");
    setSelectedLessons([]);
    setSelectedClasses([]);
    setSelectedStudents([]);
    setSelectedStatus([]);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Check if user can edit this attendance
  const canEditAttendance = (attendance: AttendanceType) => {
    if (userRole === "admin") return true;

    if (userRole === "teacher" && userId) {
      return attendance.lesson.teacher.id === userId;
    }

    return false;
  };

  // Toggle bulk attendance form
  const toggleBulkForm = () => {
    setShowBulkForm(!showBulkForm);
    if (!showBulkForm) {
      setSelectedBulkLesson(null);
      setSelectedBulkDate(new Date().toISOString().slice(0, 10));
    }
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => {
        const studentName = `${item.student.name} ${item.student.surname}`;
        const lessonName = item.lesson.name;
        const subjectName = item.lesson.subject.name;
        const className = item.lesson.class.name;

        return (
          studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lessonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          className.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply date filter
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);

      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === filterDate.getTime();
      });
    }

    // Apply lesson filter
    if (selectedLessons.length > 0) {
      result = result.filter((item) =>
        selectedLessons.includes(item.lesson.id)
      );
    }

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter((item) =>
        selectedClasses.includes(item.lesson.class.id)
      );
    }

    // Apply student filter
    if (selectedStudents.length > 0) {
      result = result.filter((item) =>
        selectedStudents.includes(item.student.id)
      );
    }

    // Apply status filter
    if (selectedStatus.length > 0) {
      result = result.filter((item) => {
        if (selectedStatus.includes("present") && item.present) return true;
        if (selectedStatus.includes("absent") && !item.present) return true;
        return false;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortConfig.key) {
          case "date":
            valueA = new Date(a.date).getTime();
            valueB = new Date(b.date).getTime();
            break;
          case "student":
            valueA = `${a.student.name} ${a.student.surname}`;
            valueB = `${b.student.name} ${b.student.surname}`;
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
    selectedDate,
    sortConfig,
    selectedLessons,
    selectedClasses,
    selectedStudents,
    selectedStatus,
  ]);

  // Calculate pagination
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Refresh data after operations
  const refreshData = useCallback(() => {
    // In a real app, this would likely involve fetching data from the server
    // For now, we'll just reset the state using initialData
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
  const renderRow = (item: AttendanceType) => {
    const date = formatDate(item.date);
    const studentName = `${item.student.name} ${item.student.surname}`;
    const lessonName = item.lesson.name;
    const subjectName = item.lesson.subject.name;
    const className = item.lesson.class.name;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
      >
        <td className="p-4">{date}</td>
        <td className="flex items-center gap-2 p-4">{studentName}</td>
        <td className="text-center">
          <span
            className={`inline-flex items-center justify-center p-1 rounded-full ${
              item.present
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.present ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <XCircle size={16} className="text-red-600" />
            )}
          </span>
        </td>
        <td className="hidden md:table-cell">{lessonName}</td>
        <td className="hidden lg:table-cell">{subjectName}</td>
        <td className="hidden lg:table-cell">{className}</td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">
          Registro de Asistencias
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
              onClick={() => requestSort("date")}
            >
              <ArrowDownUp
                size={14}
                className={`transition-transform duration-300 ${
                  sortConfig.key === "date"
                    ? sortConfig.direction === "asc"
                      ? "rotate-0"
                      : "rotate-180"
                    : ""
                }`}
              />
            </button>
            {(userRole === "admin" || userRole === "teacher") && (
              <>
                <button
                  onClick={toggleBulkForm}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs"
                >
                  <PlusCircle size={14} />
                  Asistencia Grupal
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BULK ATTENDANCE FORM */}
      {showBulkForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-md font-semibold text-gray-800 mb-4">
            Registro de Asistencia Grupal
          </h2>
          <form onSubmit={handleBulkSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Fecha</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedBulkDate}
                    onChange={(e) => setSelectedBulkDate(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md text-sm"
                    required
                  />
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Lección</label>
                <select
                  value={selectedBulkLesson || ""}
                  onChange={(e) =>
                    setSelectedBulkLesson(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-md text-sm"
                  required
                >
                  <option value="">Seleccionar lección</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name} - {lesson.subject.name} ({lesson.class.name}
                      )
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="my-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Estudiantes
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => markAllStudents(true)}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md hover:bg-green-200"
                  >
                    Marcar todos presentes
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllStudents(false)}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md hover:bg-red-200"
                  >
                    Marcar todos ausentes
                  </button>
                </div>
              </div>

              {selectedBulkLesson &&
              lessons.find((l) => l.id === selectedBulkLesson)?.students
                ?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-2">
                  {lessons
                    .find((l) => l.id === selectedBulkLesson)
                    ?.students?.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md"
                      >
                        <span className="text-sm">
                          {student.name} {student.surname}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleStudentAttendance(student.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            studentAttendances.get(student.id)
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {studentAttendances.get(student.id) ? (
                            <Check size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white p-4 border border-gray-200 rounded-md text-center text-gray-500 text-sm">
                  Seleccione una lección para ver los estudiantes
                </div>
              )}
            </div>

            {bulkFormState.error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-md">
                <span className="text-sm text-red-600">
                  {bulkFormState.message ||
                    "¡Ha ocurrido un error! Por favor, inténtalo nuevamente."}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={toggleBulkForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Guardar Asistencias
              </button>
            </div>
          </form>
        </div>
      )}

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
              {/* Date filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Fecha</h4>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md text-sm"
                  />
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Lesson filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Lecciones</h4>
                <div className="flex flex-wrap gap-2">
                  {allLessons.slice(0, 6).map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => toggleLesson(lesson.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedLessons.includes(lesson.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {lesson.name}
                    </button>
                  ))}
                  {allLessons.length > 6 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{allLessons.length - 6} más
                    </span>
                  )}
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

              {/* Student filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Estudiantes</h4>
                <div className="flex flex-wrap gap-2">
                  {allStudents.slice(0, 4).map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                        selectedStudents.includes(student.id)
                          ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {student.name} {student.surname}
                    </button>
                  ))}
                  {allStudents.length > 4 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{allStudents.length - 4} más
                    </span>
                  )}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Estado</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleStatus("present")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      selectedStatus.includes("present")
                        ? "bg-green-100 text-green-800 border-green-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Presente
                  </button>
                  <button
                    onClick={() => toggleStatus("absent")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      selectedStatus.includes("absent")
                        ? "bg-red-100 text-red-800 border-red-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Ausente
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(selectedDate ||
              selectedLessons.length > 0 ||
              selectedClasses.length > 0 ||
              selectedStudents.length > 0 ||
              selectedStatus.length > 0 ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

                  {selectedDate && (
                    <div className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md">
                      Fecha: {new Date(selectedDate).toLocaleDateString()}
                      <button
                        onClick={() => setSelectedDate("")}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {selectedLessons.map((id) => {
                    const lesson = allLessons.find((l) => l.id === id);
                    return lesson ? (
                      <div
                        key={`selected-lesson-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {lesson.name}
                        <button
                          onClick={() => toggleLesson(id)}
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

                  {selectedStudents.map((id) => {
                    const student = allStudents.find((s) => s.id === id);
                    return student ? (
                      <div
                        key={`selected-student-${id}`}
                        className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                      >
                        {student.name} {student.surname}
                        <button
                          onClick={() => toggleStudent(id)}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null;
                  })}

                  {selectedStatus.map((status) => (
                    <div
                      key={`selected-status-${status}`}
                      className={`flex items-center text-xs px-2 py-1 rounded-md ${
                        status === "present"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {status === "present" ? "Presente" : "Ausente"}
                      <button
                        onClick={() => toggleStatus(status)}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

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

export default AttendanceListClientWrapper;
