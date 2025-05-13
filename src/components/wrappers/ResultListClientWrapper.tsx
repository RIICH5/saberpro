"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowDownUp, X } from "lucide-react";
import Pagination from "../Pagination";
import Table from "../Table";
import TableSearch from "../TableSearch";
import FormContainerClient from "../FormContainer";

// Define types
interface StudentType {
  id: string;
  name: string;
  surname: string;
  class?: {
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
  subject: SubjectType;
  class: ClassType;
  teacher: TeacherType;
}

interface ExamType {
  id: number;
  title: string;
  startTime: string | Date;
  lesson: LessonType;
}

interface AssignmentType {
  id: number;
  title: string;
  startDate: string | Date;
  lesson: LessonType;
}

interface ResultType {
  id: number;
  score: number;
  passingScore?: number;
  studentId: string;
  student: StudentType;
  examId?: number;
  exam?: ExamType;
  assignmentId?: number;
  assignment?: AssignmentType;
}

interface ResultListClientWrapperProps {
  initialData: ResultType[];
  userRole?: string;
  students: StudentType[];
  exams: ExamType[];
  assignments: AssignmentType[];
  userId?: string | null;
}

const ResultListClientWrapper = ({
  initialData,
  userRole,
  students,
  exams,
  assignments,
  userId,
}: ResultListClientWrapperProps) => {
  // State
  const [data, setData] = useState<ResultType[]>(initialData);
  const [filteredData, setFilteredData] = useState<ResultType[]>(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedAssessmentTypes, setSelectedAssessmentTypes] = useState<
    string[]
  >([]);
  const ITEMS_PER_PAGE = 10;

  // Extract unique sets
  const allStudents = Array.from(
    new Map(
      initialData.map((result) => [result.student.id, result.student])
    ).values()
  );

  const allSubjects = Array.from(
    new Map(
      initialData
        .map((result) => {
          const subject = result.exam
            ? result.exam.lesson.subject
            : result.assignment
            ? result.assignment.lesson.subject
            : null;
          return subject ? [subject.id, subject] : [null, null];
        })
        .filter(([id]) => id !== null) as [number, SubjectType][]
    ).values()
  );

  const allClasses = Array.from(
    new Map(
      initialData
        .map((result) => {
          const classItem = result.exam
            ? result.exam.lesson.class
            : result.assignment
            ? result.assignment.lesson.class
            : null;
          return classItem ? [classItem.id, classItem] : [null, null];
        })
        .filter(([id]) => id !== null) as [number, ClassType][]
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
      header: "Estudiante",
      accessor: "student",
      sortable: true,
    },
    {
      header: "Tipo",
      accessor: "type",
      className: "hidden sm:table-cell",
    },
    {
      header: "Calificación",
      accessor: "score",
      className: "hidden sm:table-cell",
      sortable: true,
    },
    {
      header: "Asignatura",
      accessor: "subject",
      className: "hidden md:table-cell",
    },
    {
      header: "Clase",
      accessor: "class",
      className: "hidden lg:table-cell",
    },
    {
      header: "Fecha",
      accessor: "date",
      className: "hidden lg:table-cell",
      sortable: true,
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

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
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

  // Toggle assessment type selection
  const toggleAssessmentType = (type: string) => {
    if (selectedAssessmentTypes.includes(type)) {
      setSelectedAssessmentTypes(
        selectedAssessmentTypes.filter((t) => t !== type)
      );
    } else {
      setSelectedAssessmentTypes([...selectedAssessmentTypes, type]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStudents([]);
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setSelectedAssessmentTypes([]);
    setSearchQuery("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // Check if user can edit this result
  const canEditResult = (result: ResultType) => {
    if (userRole === "admin") return true;

    if (userRole === "teacher" && userId) {
      const teacherId = result.exam
        ? result.exam.lesson.teacher.id
        : result.assignment
        ? result.assignment.lesson.teacher.id
        : null;

      return teacherId === userId;
    }

    return false;
  };

  // Filter and sort data
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => {
        const title = item.exam
          ? item.exam.title
          : item.assignment
          ? item.assignment.title
          : "";

        const studentName = `${item.student.name} ${item.student.surname}`;

        const subjectName = item.exam
          ? item.exam.lesson.subject.name
          : item.assignment
          ? item.assignment.lesson.subject.name
          : "";

        const className = item.exam
          ? item.exam.lesson.class.name
          : item.assignment
          ? item.assignment.lesson.class.name
          : "";

        return (
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          className.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply student filter
    if (selectedStudents.length > 0) {
      result = result.filter((item) =>
        selectedStudents.includes(item.student.id)
      );
    }

    // Apply subject filter
    if (selectedSubjects.length > 0) {
      result = result.filter((item) => {
        const subjectId = item.exam
          ? item.exam.lesson.subject.id
          : item.assignment
          ? item.assignment.lesson.subject.id
          : null;

        return subjectId && selectedSubjects.includes(subjectId);
      });
    }

    // Apply class filter
    if (selectedClasses.length > 0) {
      result = result.filter((item) => {
        const classId = item.exam
          ? item.exam.lesson.class.id
          : item.assignment
          ? item.assignment.lesson.class.id
          : null;

        return classId && selectedClasses.includes(classId);
      });
    }

    // Apply assessment type filter
    if (selectedAssessmentTypes.length > 0) {
      result = result.filter((item) => {
        if (selectedAssessmentTypes.includes("exam") && item.exam) return true;
        if (selectedAssessmentTypes.includes("assignment") && item.assignment)
          return true;
        return false;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortConfig.key) {
          case "title":
            valueA = a.exam
              ? a.exam.title
              : a.assignment
              ? a.assignment.title
              : "";
            valueB = b.exam
              ? b.exam.title
              : b.assignment
              ? b.assignment.title
              : "";
            break;
          case "student":
            valueA = `${a.student.name} ${a.student.surname}`;
            valueB = `${b.student.name} ${b.student.surname}`;
            break;
          case "score":
            valueA = a.score;
            valueB = b.score;
            break;
          case "date":
            valueA = new Date(
              a.exam
                ? a.exam.startTime
                : a.assignment
                ? a.assignment.startDate
                : 0
            ).getTime();
            valueB = new Date(
              b.exam
                ? b.exam.startTime
                : b.assignment
                ? b.assignment.startDate
                : 0
            ).getTime();
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
    selectedStudents,
    selectedSubjects,
    selectedClasses,
    selectedAssessmentTypes,
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
  const renderRow = (item: ResultType) => {
    const title = item.exam
      ? item.exam.title
      : item.assignment
      ? item.assignment.title
      : "";

    const type = item.exam ? "Examen" : item.assignment ? "Tarea" : "";

    const subject = item.exam
      ? item.exam.lesson.subject.name
      : item.assignment
      ? item.assignment.lesson.subject.name
      : "";

    const classItem = item.exam
      ? item.exam.lesson.class.name
      : item.assignment
      ? item.assignment.lesson.class.name
      : "";

    const date = item.exam
      ? formatDate(item.exam.startTime)
      : item.assignment
      ? formatDate(item.assignment.startDate)
      : "";

    // Pass the correct assessmentType and assessmentId to the update form
    const formData = {
      ...item,
      assessmentType: item.exam ? "exam" : "assignment",
      assessmentId: item.exam ? item.examId : item.assignmentId,
    };

    const passingScore =
      item.passingScore !== undefined ? item.passingScore : 60;

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50 transition-colors duration-200"
      >
        <td className="p-4">{title}</td>
        <td className="flex items-center gap-2 p-4">
          {item.student.name} {item.student.surname}
        </td>
        <td className="hidden sm:table-cell">{type}</td>
        <td className="hidden sm:table-cell">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              item.score >= passingScore
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.score}
          </span>
        </td>
        <td className="hidden md:table-cell">{subject}</td>
        <td className="hidden lg:table-cell">{classItem}</td>
        <td className="hidden lg:table-cell">{date}</td>
        {(userRole === "admin" || userRole === "teacher") && (
          <td>
            <div className="flex items-center gap-2">
              {canEditResult(item) && (
                <>
                  <FormContainerClient
                    table="result"
                    type="update"
                    data={formData}
                    userRole={userRole}
                    relatedData={{ students, exams, assignments }}
                    onComplete={refreshData}
                  />
                  <FormContainerClient
                    table="result"
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
          Todos los Resultados
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
              onClick={() => requestSort("score")}
            >
              <ArrowDownUp
                size={14}
                className={`transition-transform duration-300 ${
                  sortConfig.key === "score"
                    ? sortConfig.direction === "asc"
                      ? "rotate-0"
                      : "rotate-180"
                    : ""
                }`}
              />
            </button>
            {(userRole === "admin" || userRole === "teacher") && (
              <FormContainerClient
                table="result"
                type="create"
                userRole={userRole}
                relatedData={{ students, exams, assignments }}
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
              {/* Student filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Estudiantes</h4>
                <div className="flex flex-wrap gap-2">
                  {allStudents.map((student) => (
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

              {/* Assessment Type filter */}
              <div>
                <h4 className="text-sm font-medium mb-3">Tipo de Evaluación</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleAssessmentType("exam")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      selectedAssessmentTypes.includes("exam")
                        ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Examen
                  </button>
                  <button
                    onClick={() => toggleAssessmentType("assignment")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 border ${
                      selectedAssessmentTypes.includes("assignment")
                        ? "bg-gray-100 text-gray-800 border-gray-300 font-medium shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    Tarea
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(selectedStudents.length > 0 ||
              selectedSubjects.length > 0 ||
              selectedClasses.length > 0 ||
              selectedAssessmentTypes.length > 0 ||
              searchQuery) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    Filtros activos:
                  </span>

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

                  {selectedAssessmentTypes.map((type) => (
                    <div
                      key={`selected-type-${type}`}
                      className="flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                    >
                      {type === "exam" ? "Examen" : "Tarea"}
                      <button
                        onClick={() => toggleAssessmentType(type)}
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

export default ResultListClientWrapper;
