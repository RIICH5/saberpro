"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import {
  announcementSchema,
  AnnouncementSchema,
} from "@/lib/formValidationSchemas";
import {
  createAnnouncement,
  updateAnnouncement,
} from "@/lib/announcementActions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, Layers } from "lucide-react";

interface ClassType {
  id: number;
  name: string;
}

const AnnouncementForm = ({
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
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      id: data?.id || undefined,
      title: data?.title || "",
      description: data?.description || "",
      date: data?.date
        ? new Date(data.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      classId: data?.classId?.toString() || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
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
        `¡El anuncio ha sido ${type === "create" ? "creado" : "actualizado"}!`
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

  const { classes = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nuevo anuncio" : "Actualizar anuncio"}
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {/* Title */}
        <InputField
          label="Título del anuncio"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{
            placeholder: "Título del anuncio",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Descripción</label>
          <textarea
            {...register("description")}
            placeholder="Descripción del anuncio"
            className={`w-full p-3 border ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            } rounded-md text-sm min-h-[100px]`}
          />
          {errors.description?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.description.message.toString()}
              </p>
            </div>
          )}
        </div>

        {/* Class Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Clase (opcional)</label>
          <div className="relative">
            <select
              {...register("classId")}
              className={`w-full p-3 pl-10 border ${
                errors.classId ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-md text-sm`}
            >
              <option value="">Para toda la escuela</option>
              {classes.map((classItem: ClassType) => (
                <option key={classItem.id} value={classItem.id.toString()}>
                  {classItem.name}
                </option>
              ))}
            </select>
            <Layers
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
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

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">Fecha</label>
          <div className="relative">
            <input
              type="date"
              {...register("date")}
              className={`w-full p-3 pl-10 border ${
                errors.date ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-md text-sm`}
            />
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          {errors.date?.message && (
            <div className="flex items-start gap-1 mt-1">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-500">
                {errors.date.message.toString()}
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

export default AnnouncementForm;
