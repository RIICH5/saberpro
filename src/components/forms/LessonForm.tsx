"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  lessonSchema,
  LessonSchema,
  DayEnum,
} from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/lessonActions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface SubjectType {
  id: number;
  name: string;
}

interface ClassType {
  id: number;
  name: string;
}

interface TeacherType {
  id: string;
  name: string;
  surname: string;
}

const LessonForm = ({
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
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      id: data?.id || undefined,
      name: data?.name || "",
      day: data?.day || "MONDAY",
      startTime: data?.startTime || "",
      endTime: data?.endTime || "",
      subjectId: data?.subjectId?.toString() || "",
      classId: data?.classId?.toString() || "",
      teacherId: data?.teacherId || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `¡La lección ha sido ${type === "create" ? "creada" : "actualizada"}!`
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

  const { subjects = [], classes = [], teachers = [] } = relatedData || {};

  // Días de la semana en español
  const daysTranslation: Record<string, string> = {
    MONDAY: "Lunes",
    TUESDAY: "Martes",
    WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves",
    FRIDAY: "Viernes",
  };

  // Para validar que la hora de fin sea después de la hora de inicio
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nueva lección" : "Actualizar lección"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nombre de la lección"
          name="name"
          register={register}
          error={errors?.name}
          inputProps={{
            placeholder: "Nombre de la lección",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        {/* Day Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Día</label>
          <select
            {...register("day")}
            className={`w-full p-3 border ${
              errors.day ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            {Object.keys(daysTranslation).map((day) => (
              <option key={day} value={day}>
                {daysTranslation[day]}
              </option>
            ))}
          </select>
          {errors.day?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.day.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Start Time */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Hora de inicio</label>
          <input
            type="datetime-local"
            {...register("startTime")}
            className={`w-full p-3 border ${
              errors.startTime ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          />
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
          <label className="text-xs text-gray-600">Hora de finalización</label>
          <input
            type="datetime-local"
            {...register("endTime")}
            className={`w-full p-3 border ${
              errors.endTime ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          />
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

        {/* Subject Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Asignatura</label>
          <select
            {...register("subjectId")}
            className={`w-full p-3 border ${
              errors.subjectId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar asignatura</option>
            {subjects.map((subject: SubjectType) => (
              <option key={subject.id} value={subject.id.toString()}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.subjectId.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Class Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Clase</label>
          <select
            {...register("classId")}
            className={`w-full p-3 border ${
              errors.classId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar clase</option>
            {classes.map((classItem: ClassType) => (
              <option key={classItem.id} value={classItem.id.toString()}>
                {classItem.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.classId.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Teacher Selection */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-600">Profesor</label>
          <select
            {...register("teacherId")}
            className={`w-full p-3 border ${
              errors.teacherId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar profesor</option>
            {teachers.map((teacher: TeacherType) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.teacherId.message.toString()}
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

export default LessonForm;
