"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface TeacherType {
  id: string;
  name: string;
  surname: string;
}

interface GradeType {
  id: number;
  level: number;
}

const ClassForm = ({
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
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: data?.name || "",
      capacity: data?.capacity || 30,
      id: data?.id || undefined,
      supervisorId: data?.supervisorId || "",
      gradeId: data?.gradeId?.toString() || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    // Convertir los valores numéricos
    const formattedData = {
      ...data,
      capacity: Number(data.capacity),
      gradeId: Number(data.gradeId),
    };

    formAction(formattedData as any);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `¡La clase ha sido ${type === "create" ? "creada" : "actualizada"}!`
      );
      setOpen(false);
      router.refresh();
      if (onComplete) onComplete();
    } else if (state.error) {
      toast.error("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
    }
  }, [state, router, type, setOpen, onComplete]);

  const { teachers = [], grades = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nueva clase" : "Actualizar clase"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nombre de la clase"
          name="name"
          register={register}
          error={errors?.name}
          inputProps={{
            placeholder: "Nombre de la clase",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        <InputField
          label="Capacidad"
          name="capacity"
          register={register}
          error={errors?.capacity}
          inputProps={{
            placeholder: "Capacidad",
            type: "number",
            min: "1",
            max: "100",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        {/* Supervisor Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Supervisor</label>
          <select
            {...register("supervisorId")}
            className={`w-full p-3 border ${
              errors.supervisorId
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar supervisor</option>
            {teachers.map((teacher: TeacherType) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.supervisorId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.supervisorId.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Grade Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Grado</label>
          <select
            {...register("gradeId")}
            className={`w-full p-3 border ${
              errors.gradeId ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm`}
          >
            <option value="">Seleccionar grado</option>
            {grades.map((grade: GradeType) => (
              <option key={grade.id} value={grade.id.toString()}>
                Grado {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.gradeId.message.toString()}
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
            ¡Ha ocurrido un error! Por favor, inténtalo nuevamente.
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

export default ClassForm;
