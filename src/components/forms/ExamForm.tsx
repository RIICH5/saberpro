"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/examActions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, BookOpen, Layers, User } from "lucide-react";

interface LessonType {
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
}

const ExamForm = ({
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
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      id: data?.id || undefined,
      title: data?.title || "",
      startTime: data?.startTime
        ? new Date(data.startTime).toISOString().slice(0, 16)
        : "",
      endTime: data?.endTime
        ? new Date(data.endTime).toISOString().slice(0, 16)
        : "",
      lessonId: data?.lessonId?.toString() || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `¡El examen ha sido ${type === "create" ? "creado" : "actualizado"}!`
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

  const { lessons = [] } = relatedData || {};
  const watchLessonId = watch("lessonId");

  // Actualizar la lección seleccionada cuando cambia el ID
  useEffect(() => {
    if (watchLessonId) {
      const lessonId =
        typeof watchLessonId === "string"
          ? parseInt(watchLessonId)
          : watchLessonId;

      const lesson = lessons.find((l: LessonType) => l.id === lessonId);
      setSelectedLesson(lesson || null);
    } else {
      setSelectedLesson(null);
    }
  }, [watchLessonId, lessons]);

  // Para validar que la fecha de fin sea después de la fecha de inicio
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nuevo examen" : "Actualizar examen"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Título del examen"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{
            placeholder: "Título del examen",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        {/* Lesson Selection */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-600">Lección</label>
          <select
            {...register("lessonId")}
            className={`w-full p-3 border ${
              errors.lessonId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar lección</option>
            {lessons.map((lesson: LessonType) => (
              <option key={lesson.id} value={lesson.id.toString()}>
                {lesson.name} - {lesson.subject.name} ({lesson.class.name})
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.lessonId.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Selected Lesson Info */}
        {selectedLesson && (
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-md mb-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Información de la lección:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Asignatura</p>
                  <p className="text-sm font-medium">
                    {selectedLesson.subject.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Clase</p>
                  <p className="text-sm font-medium">
                    {selectedLesson.class.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Profesor</p>
                  <p className="text-sm font-medium">
                    {selectedLesson.teacher.name}{" "}
                    {selectedLesson.teacher.surname}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Time */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">
            Fecha y hora de inicio
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              {...register("startTime")}
              className={`w-full p-3 pl-10 border ${
                errors.startTime
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              } rounded-md text-sm`}
            />
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          {errors.startTime?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.startTime.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* End Time */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">
            Fecha y hora de finalización
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              {...register("endTime")}
              className={`w-full p-3 pl-10 border ${
                errors.endTime ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-md text-sm`}
            />
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          {errors.endTime?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.endTime.message.toString()}
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

export default ExamForm;
