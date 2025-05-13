"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Search, X, Plus, Minus, User, Check } from "lucide-react";

interface TeacherType {
  id: string;
  name: string;
  surname: string;
  username?: string;
  email?: string;
}

const SubjectForm = ({
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
    getValues,
    watch,
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: data?.name || "",
      id: data?.id,
      teachers: Array.isArray(data?.teachers)
        ? data.teachers.map((t: any) =>
            typeof t === "object" && t !== null && "id" in t
              ? String(t.id)
              : String(t)
          )
        : [],
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(
        `¡La asignatura ha sido ${
          type === "create" ? "creada" : "actualizada"
        }!`
      );
      setOpen(false);
      router.refresh();
      if (onComplete) onComplete();
    }
  }, [state, router, type, setOpen, onComplete]);

  const { teachers } = relatedData || { teachers: [] };
  const watchTeachers = watch("teachers");

  // Teacher selection states
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher: TeacherType) => {
      const fullName = `${teacher.name} ${teacher.surname}`.toLowerCase();
      return fullName.includes(teacherSearchQuery.toLowerCase());
    });
  }, [teachers, teacherSearchQuery]);

  // Get selected teacher names
  const selectedTeachers = useMemo(() => {
    return (
      watchTeachers
        ?.map((id) => {
          const teacher = teachers.find(
            (t: TeacherType) => String(t.id) === id
          );
          return teacher
            ? { id: teacher.id, name: `${teacher.name} ${teacher.surname}` }
            : null;
        })
        .filter(Boolean) || []
    );
  }, [watchTeachers, teachers]);

  // Toggle teacher selection
  const toggleTeacher = (teacherId: string) => {
    const currentTeachers = getValues("teachers") || [];

    if (currentTeachers.includes(teacherId)) {
      setValue(
        "teachers",
        currentTeachers.filter((id) => id !== teacherId),
        { shouldValidate: true }
      );
    } else {
      setValue("teachers", [...currentTeachers, teacherId], {
        shouldValidate: true,
      });
    }
  };

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nueva asignatura" : "Actualizar asignatura"}
      </h1>

      <div className="grid grid-cols-1 gap-4">
        <InputField
          label="Nombre de la asignatura"
          name="name"
          register={register}
          error={errors?.name}
          inputProps={{
            placeholder: "Nombre de la asignatura",
            className: "w-full p-3 border border-gray-300 rounded-md text-sm",
          }}
        />

        {data && (
          <InputField
            label="Id"
            name="id"
            register={register}
            error={errors?.id}
            hidden
          />
        )}

        {/* Custom combobox for teacher selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-600">Profesores</label>

          <div className="relative">
            <div
              className={`min-h-[80px] p-3 border ${
                errors.teachers ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-md text-sm cursor-pointer`}
              onClick={() => setShowTeacherSelector((prev) => !prev)}
            >
              {selectedTeachers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTeachers.map((teacher) => (
                    <div
                      key={teacher?.id}
                      className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {teacher?.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the dropdown
                          toggleTeacher(teacher?.id);
                        }}
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">Seleccionar profesores</span>
              )}
            </div>

            {showTeacherSelector && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[320px] overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar profesores..."
                      className="w-full p-2 pl-8 border border-gray-200 rounded-md text-sm"
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Search
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto p-2">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher: TeacherType) => (
                      <div
                        key={teacher.id}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                          watchTeachers?.includes(teacher.id)
                            ? "bg-gray-50"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTeacher(teacher.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <span className="text-sm">
                            {teacher.name} {teacher.surname}
                          </span>
                        </div>
                        {watchTeachers?.includes(teacher.id) ? (
                          <div className="flex items-center">
                            <Check size={16} className="text-green-500 mr-1" />
                            <Minus size={16} className="text-red-500" />
                          </div>
                        ) : (
                          <Plus size={16} className="text-green-500" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500 text-sm">
                      No hay profesores disponibles
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    className="text-xs px-3 py-1 bg-gray-100 rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTeacherSelector(false);
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {errors.teachers?.message && (
            <div className="flex items-start gap-1 mt-1">
              <X size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">
                {errors.teachers.message.toString()}
              </p>
            </div>
          )}
        </div>
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

export default SubjectForm;
