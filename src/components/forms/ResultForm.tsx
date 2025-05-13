"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { resultSchema, ResultSchema } from "@/lib/formValidationSchemas";
import { createResult, updateResult } from "@/lib/resultActions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AlertCircle, User, BookOpen, Layers, Percent } from "lucide-react";

interface StudentType {
  id: string;
  name: string;
  surname: string;
  class?: {
    id: number;
    name: string;
  };
}

interface ExamType {
  id: number;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  lesson: {
    id: number;
    name: string;
    subject: {
      id: number;
      name: string;
    };
    class: {
      id: number;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
  };
}

interface AssignmentType {
  id: number;
  title: string;
  startDate: string | Date;
  dueDate: string | Date;
  lesson: {
    id: number;
    name: string;
    subject: {
      id: number;
      name: string;
    };
    class: {
      id: number;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
      surname: string;
    };
  };
}

const ResultForm = ({
  type,
  data,
  setOpen,
  relatedData,
  onComplete,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
  onComplete?: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      id: data?.id || undefined,
      score: data?.score || 0,
      studentId: data?.studentId || "",
      assessmentType:
        data?.assessmentType ||
        (data?.examId ? "exam" : data?.assignmentId ? "assignment" : ""),
      assessmentId:
        data?.assessmentId ||
        data?.examId?.toString() ||
        data?.assignmentId?.toString() ||
        "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(
    null
  );
  const [filteredExams, setFilteredExams] = useState<ExamType[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<
    AssignmentType[]
  >([]);

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `¡El resultado ha sido ${type === "create" ? "creado" : "actualizado"}!`
      );
      setOpen(false);
      router.refresh();
      if (onComplete) onComplete();
    } else if (state.error) {
      toast.error(
        state.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo."
      );
    }
  }, [state, router, type, setOpen, onComplete]);

  const { students = [], exams = [], assignments = [] } = relatedData || {};
  const watchStudentId = watch("studentId");
  const watchAssessmentType = watch("assessmentType");

  // Update the selected student when studentId changes
  useEffect(() => {
    if (watchStudentId) {
      const student = students.find(
        (s: StudentType) => s.id === watchStudentId
      );
      setSelectedStudent(student || null);

      // Filter exams and assignments for the selected class
      if (student?.class) {
        const studentClassId = student.class.id;

        // Filter exams by class
        setFilteredExams(
          exams.filter(
            (exam: ExamType) => exam.lesson.class.id === studentClassId
          )
        );

        // Filter assignments by class
        setFilteredAssignments(
          assignments.filter(
            (assignment: AssignmentType) =>
              assignment.lesson.class.id === studentClassId
          )
        );
      } else {
        setFilteredExams([]);
        setFilteredAssignments([]);
      }
    } else {
      setSelectedStudent(null);
      setFilteredExams([]);
      setFilteredAssignments([]);
    }
  }, [watchStudentId, students, exams, assignments]);

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nuevo resultado" : "Actualizar resultado"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Selection */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-600">Estudiante</label>
          <select
            {...register("studentId")}
            className={`w-full p-3 border ${
              errors.studentId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar estudiante</option>
            {students.map((student: StudentType) => (
              <option key={student.id} value={student.id}>
                {student.name} {student.surname}
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.studentId.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Selected Student Info */}
        {selectedStudent && (
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-md mb-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Información del estudiante:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Nombre completo</p>
                  <p className="text-sm font-medium">
                    {selectedStudent.name} {selectedStudent.surname}
                  </p>
                </div>
              </div>
              {selectedStudent.class && (
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Clase</p>
                    <p className="text-sm font-medium">
                      {selectedStudent.class.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment Type Selection */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-600">Tipo de Evaluación</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="exam"
                {...register("assessmentType")}
                className="text-gray-900"
              />
              <span className="text-sm">Examen</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="assignment"
                {...register("assessmentType")}
                className="text-gray-900"
              />
              <span className="text-sm">Tarea</span>
            </label>
          </div>
          {errors.assessmentType?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.assessmentType.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Assessment Selection - conditional based on type */}
        {watchAssessmentType && (
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-gray-600">
              {watchAssessmentType === "exam" ? "Examen" : "Tarea"}
            </label>
            <select
              {...register("assessmentId")}
              className={`w-full p-3 border ${
                errors.assessmentId
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              } rounded-md text-sm`}
            >
              <option value="">
                Seleccionar{" "}
                {watchAssessmentType === "exam" ? "examen" : "tarea"}
              </option>
              {watchAssessmentType === "exam"
                ? filteredExams.map((exam: ExamType) => (
                    <option key={exam.id} value={exam.id.toString()}>
                      {exam.title} - {exam.lesson.subject.name} (
                      {exam.lesson.class.name})
                    </option>
                  ))
                : filteredAssignments.map((assignment: AssignmentType) => (
                    <option
                      key={assignment.id}
                      value={assignment.id.toString()}
                    >
                      {assignment.title} - {assignment.lesson.subject.name} (
                      {assignment.lesson.class.name})
                    </option>
                  ))}
            </select>
            {errors.assessmentId?.message && (
              <div className="flex items-start gap-1 mt-1">
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-500">
                  {errors.assessmentId.message.toString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-600">Calificación</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("score")}
              className={`w-full p-3 pl-10 border ${
                errors.score ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-md text-sm`}
            />
            <Percent
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          {errors.score?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.score.message.toString()}
              </p>
            </div>
          )}
        </div>

        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            error={errors?.id}
            hidden
          />
        )}
      </div>

      {state.error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-md">
          <span className="text-sm text-red-600">
            {state.message ||
              "¡Ha ocurrido un error! Por favor, inténtalo nuevamente."}
          </span>
        </div>
      )}

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          {type === "create" ? "Crear" : "Actualizar"}
        </button>
      </div>
    </form>
  );
};

export default ResultForm;
