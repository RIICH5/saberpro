"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  User,
  Search,
  X,
  Plus,
  Minus,
  Check,
  Shuffle,
  AlertCircle,
  EyeOff,
  Eye,
} from "lucide-react";
import { createParent, updateParent } from "@/lib/parentActions";

interface StudentType {
  id: string;
  name: string;
  surname?: string;
  username?: string;
}

const generateRandomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ParentForm = ({
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
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      id: data?.id || "",
      students: Array.isArray(data?.students)
        ? data.students.map((s: any) =>
            typeof s === "object" && s !== null && "id" in s
              ? String(s.id)
              : String(s)
          )
        : [],
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createParent : updateParent,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();
  const [img, setImg] = useState<{ secure_url: string } | null>(
    data?.img ? { secure_url: data.img as string } : null
  );

  // Student selection state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const watchStudents = watch("students");

  // Handle form submission
  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();

    // Add basic fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === "students" && Array.isArray(value)) {
        value.forEach((studentId) => {
          formData.append("students[]", studentId);
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add image if available
    if (img?.secure_url) {
      formData.append("img", img.secure_url);
    }

    formAction(formData);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `¡Padre ha sido ${type === "create" ? "creado" : "actualizado"}!`
      );
      setOpen(false);
      router.refresh();
      if (onComplete) onComplete();
    } else if (state.error) {
      toast.error("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
    }
  }, [state, router, type, setOpen, onComplete]);

  const { students = [] } = relatedData || {};

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter((student: StudentType) => {
      const fullName = `${student.name} ${student.surname || ""}`.toLowerCase();
      return (
        fullName.includes(studentSearchQuery.toLowerCase()) ||
        (student.username &&
          student.username
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase()))
      );
    });
  }, [students, studentSearchQuery]);

  // Get selected student names
  const selectedStudents = useMemo(() => {
    return (
      watchStudents
        ?.map((id) => {
          const student = students.find(
            (s: StudentType) => String(s.id) === id
          );
          return student
            ? {
                id: student.id,
                name: `${student.name} ${student.surname || ""}`,
                username: student.username,
              }
            : null;
        })
        .filter(Boolean) || []
    );
  }, [watchStudents, students]);

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    const currentStudents = getValues("students") || [];

    if (currentStudents.includes(studentId)) {
      setValue(
        "students",
        currentStudents.filter((id) => id !== studentId),
        { shouldValidate: true }
      );
    } else {
      setValue("students", [...currentStudents, studentId], {
        shouldValidate: true,
      });
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  const watchPassword = watch("password");

  useEffect(() => {
    if (watchPassword) {
      setPasswordValidation({
        minLength: watchPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(watchPassword),
        hasLowercase: /[a-z]/.test(watchPassword),
        hasNumber: /[0-9]/.test(watchPassword),
      });
    }
  }, [watchPassword]);

  const handleGenerateId = () => {
    setValue("username", generateRandomId());
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Crear nuevo padre" : "Actualizar padre"}
      </h1>

      <div>
        <span className="text-gray-600 text-sm font-medium">
          Información de Autenticación
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">
              Número de Cuenta (6 dígitos)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                {...register("username")}
                placeholder="Ej. 123456"
                className={`w-full p-3 pr-10 border ${
                  errors.username
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } rounded-md text-sm`}
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleGenerateId}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title="Generar ID aleatorio"
              >
                <Shuffle size={18} className="transition-all duration-200" />
              </button>
            </div>
            {errors.username?.message && (
              <div className="flex items-start gap-1 mt-1">
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-500">
                  {errors.username.message.toString()}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Solo números. Debe tener 6 dígitos.
            </p>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">
              Contraseña
              {type === "create" && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Contraseña"
                className={`w-full p-3 pr-10 border ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : passwordValidation.minLength &&
                      passwordValidation.hasUppercase &&
                      passwordValidation.hasLowercase &&
                      passwordValidation.hasNumber &&
                      watchPassword
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300"
                } rounded-md text-sm`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} className="transition-all duration-200" />
                ) : (
                  <Eye size={18} className="transition-all duration-200" />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <div className="flex items-start gap-1 mt-1">
                <AlertCircle
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-500">
                  {errors.password.message.toString()}
                </p>
              </div>
            )}
            {/* Password requirements */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600 font-medium">
                Requisitos de contraseña:
              </p>
              <ul className="text-xs space-y-1">
                <li className="flex items-center gap-1">
                  {passwordValidation.minLength ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <X size={12} className="text-gray-400" />
                  )}
                  <span
                    className={
                      passwordValidation.minLength
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    Mínimo 8 caracteres
                  </span>
                </li>
                <li className="flex items-center gap-1">
                  {passwordValidation.hasUppercase ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <X size={12} className="text-gray-400" />
                  )}
                  <span
                    className={
                      passwordValidation.hasUppercase
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    Al menos una letra mayúscula
                  </span>
                </li>
                <li className="flex items-center gap-1">
                  {passwordValidation.hasLowercase ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <X size={12} className="text-gray-400" />
                  )}
                  <span
                    className={
                      passwordValidation.hasLowercase
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    Al menos una letra minúscula
                  </span>
                </li>
                <li className="flex items-center gap-1">
                  {passwordValidation.hasNumber ? (
                    <Check size={12} className="text-green-500" />
                  ) : (
                    <X size={12} className="text-gray-400" />
                  )}
                  <span
                    className={
                      passwordValidation.hasNumber
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    Al menos un número
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <span className="text-gray-600 text-base font-medium">
          Información Personal
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          <InputField
            label="Nombre"
            name="name"
            register={register}
            error={errors?.name}
            inputProps={{
              placeholder: "Nombre",
              className: "w-full p-3 border border-gray-300 rounded-md text-sm",
            }}
          />

          <InputField
            label="Apellido"
            name="surname"
            register={register}
            error={errors?.surname}
            inputProps={{
              placeholder: "Apellido",
              className: "w-full p-3 border border-gray-300 rounded-md text-sm",
            }}
          />

          <InputField
            label="Correo Electrónico"
            name="email"
            register={register}
            error={errors?.email}
            inputProps={{
              placeholder: "Correo electrónico",
              type: "email",
              className: "w-full p-3 border border-gray-300 rounded-md text-sm",
            }}
          />

          {/* Phone with formatting */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Teléfono</label>
            {(() => {
              const { onChange, ...rest } = register("phone");
              return (
                <input
                  {...rest}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    // Format as (123) 456-7890
                    let formatted = cleaned;
                    if (cleaned.length > 6) {
                      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(
                        3,
                        6
                      )}-${cleaned.slice(6)}`;
                    } else if (cleaned.length > 3) {
                      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(
                        3
                      )}`;
                    } else if (cleaned.length > 0) {
                      formatted = `(${cleaned}`;
                    }
                    e.target.value = formatted;
                    onChange(e);
                  }}
                  placeholder="Teléfono (10 dígitos)"
                  className={`w-full p-3 border ${
                    errors.phone
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } rounded-md text-sm`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                />
              );
            })()}
            {errors.phone?.message && (
              <div className="flex items-start gap-1 mt-1">
                <X size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-500">
                  {errors.phone.message.toString()}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <InputField
              label="Dirección"
              name="address"
              register={register}
              error={errors?.address}
              inputProps={{
                placeholder: "Dirección",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
              }}
            />
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
      </div>

      {/* Student Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-600">Estudiantes</label>

        <div className="relative">
          <div
            className={`min-h-[80px] p-3 border ${
              errors.students ? "border-red-300 bg-red-50" : "border-gray-300"
            } rounded-md text-sm cursor-pointer`}
            onClick={() => setShowStudentSelector((prev) => !prev)}
          >
            {selectedStudents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <div
                    key={student?.id}
                    className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {student?.name}
                    {student?.username && (
                      <span className="text-gray-500 text-xs ml-1">
                        ({student?.username})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the dropdown
                        toggleStudent(student?.id);
                      }}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">Seleccionar estudiantes</span>
            )}
          </div>

          {showStudentSelector && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar estudiantes..."
                    className="w-full p-2 pl-8 border border-gray-200 rounded-md text-sm"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Search
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>

              <div className="max-h-[200px] overflow-y-auto p-2">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student: StudentType) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                        watchStudents?.includes(student.id) ? "bg-gray-50" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStudent(student.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <div>
                          <span className="text-sm">
                            {student.name} {student.surname || ""}
                          </span>
                          {student.username && (
                            <p className="text-xs text-gray-500">
                              {student.username}
                            </p>
                          )}
                        </div>
                      </div>
                      {watchStudents?.includes(student.id) ? (
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
                    No hay estudiantes disponibles
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  className="text-xs px-3 py-1 bg-gray-100 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStudentSelector(false);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {errors.students?.message && (
          <div className="flex items-start gap-1 mt-1">
            <X size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-500">
              {errors.students.message.toString()}
            </p>
          </div>
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

export default ParentForm;
