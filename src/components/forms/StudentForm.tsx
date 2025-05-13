"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  useState,
  useEffect,
  useTransition,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import {
  Upload,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
  Shuffle,
  Search,
} from "lucide-react";

enum UserSex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface StudentFormProps {
  type: "create" | "update";
  data?: Record<string, unknown>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    classes?: Array<{ id: number; name: string }>;
    grades?: Array<{ id: number; level: number }>;
    [key: string]: unknown;
  };
  onComplete?: () => void;
}

const generateRandomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const StudentForm = ({
  type,
  data,
  setOpen,
  relatedData,
  onComplete,
}: StudentFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<StudentSchema | null>(
    null
  );
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [birthdayTouched, setBirthdayTouched] = useState(false);

  const classes = relatedData?.classes || [];
  const grades = relatedData?.grades || [];
  const parents = Array.isArray(relatedData?.parents)
    ? relatedData.parents
    : [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    reset,
    setValue,
    getValues,
    clearErrors,
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...data,
      // Convert birthday to YYYY-MM-DD string for input type="date"
      birthday:
        typeof data?.birthday === "string"
          ? new Date(data.birthday)
          : data?.birthday
          ? new Date(data.birthday as Date)
          : undefined,
      username:
        (data?.username as string) ||
        (type === "create" ? generateRandomId() : ""),
      sex: (data?.sex as UserSex) || UserSex.MALE,
      gradeId: data?.gradeId ? Number(data.gradeId) : undefined,
      classId: data?.classId ? Number(data.classId) : undefined,
      parentId: (data?.parentId as string) || "",
      // Always set password to empty string for edit (never prefill real password)
      password: "",
    },
  });

  const [img, setImg] = useState<{ secure_url: string } | null>(
    data?.img ? { secure_url: data.img as string } : null
  );

  const watchPassword = watch("password");
  const watchUsername = watch("username");
  const watchBirthday = watch("birthday");
  const watchClassId = watch("classId");
  const watchGradeId = watch("gradeId");

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  const isValidAge = useMemo(() => {
    if (!watchBirthday) return true;
    const birthDate = new Date(watchBirthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age >= 5;
  }, [watchBirthday]);

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

  useEffect(() => {
    if (birthdayTouched) {
      if (!isValidAge && watchBirthday) {
        setError("birthday", {
          type: "manual",
          message: "El estudiante debe tener al menos 5 años.",
        });
      } else if (watchBirthday) {
        clearErrors("birthday");
      }
    }
  }, [isValidAge, watchBirthday, birthdayTouched, setError, clearErrors]);

  const handleGenerateId = () => {
    setValue("username", generateRandomId());
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem: any) =>
      classItem.name.toLowerCase().includes(classSearchQuery.toLowerCase())
    );
  }, [classes, classSearchQuery]);

  const selectedClassName = useMemo(() => {
    const classItem = classes.find(
      (c: any) => String(c.id) === String(watchClassId)
    );
    return classItem ? classItem.name : "";
  }, [watchClassId, classes]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!isValidAge) {
      setError("birthday", {
        type: "manual",
        message: "El estudiante debe tener al menos 5 años.",
      });
      return;
    }

    const id = toast.loading(
      type === "create" ? "Creando estudiante..." : "Actualizando estudiante..."
    );
    setToastId(id);

    // Build the plain object for StudentSchema
    const payload: StudentSchema = {
      ...formData,
      img: img?.secure_url || "",
      birthday: new Date(formData.birthday as any),
      gradeId: Number(formData.gradeId),
      classId: Number(formData.classId),
      parentId: formData.parentId ? formData.parentId : undefined, // <-- fix here
      password: formData.password ?? "",
    };

    startTransition(async () => {
      try {
        const result =
          type === "create"
            ? await createStudent(
                { success: false, error: false },
                payload as any
              )
            : await updateStudent(
                { success: false, error: false },
                {
                  ...payload,
                  password: payload.password ?? "",
                  id: data?.id ? String(data.id) : undefined,
                }
              );

        if (result.success) {
          toast.update(id, {
            render: `Estudiante ${
              type === "create" ? "creado" : "actualizado"
            } exitosamente!`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });

          if (type === "create") {
            setCreatedStudent(formData);
            setShowSuccessDialog(true);
          } else {
            setOpen(false);
          }

          if (onComplete) onComplete();
          router.refresh();
        } else {
          toast.update(id, {
            render: "Ha ocurrido un error",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.update(id, {
          render: "Error al procesar la solicitud",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    });
  });

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setOpen(false);
  };

  return (
    <>
      <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create"
            ? "Crear nuevo estudiante"
            : "Actualizar estudiante"}
        </h1>

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
            {img?.secure_url ? (
              <img
                src={img.secure_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
          </div>
          <CldUploadWidget
            uploadPreset="saberpro"
            onSuccess={(result: any) => {
              const info = result.info as { secure_url: string };
              setImg(info);
            }}
          >
            {({ open }: { open: () => void }) => (
              <button
                type="button"
                className="flex items-center text-sm gap-2 text-gray-600"
                onClick={() => open()}
              >
                <Upload size={16} />
                <span>Subir foto</span>
              </button>
            )}
          </CldUploadWidget>
        </div>

        {/* Auth Information */}
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

        {/* Personal Information */}
        <div>
          <span className="text-gray-600 text-sm font-medium">
            Información Personal
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <InputField
              label="Nombre"
              name="name"
              register={register}
              error={errors.name}
              inputProps={{
                placeholder: "Nombre",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
              }}
            />
            <InputField
              label="Apellido"
              name="surname"
              register={register}
              error={errors.surname}
              inputProps={{
                placeholder: "Apellido",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
              }}
            />
            <InputField
              label="Correo Electrónico"
              name="email"
              register={register}
              error={errors.email}
              inputProps={{
                placeholder: "Correo electrónico",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
                type: "email",
              }}
            />
            <InputField
              label="Teléfono"
              name="phone"
              register={register}
              error={errors.phone}
              inputProps={{
                placeholder: "Teléfono (10 dígitos)",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
                type: "tel",
                maxLength: 10,
              }}
            />
            <InputField
              label="Dirección"
              name="address"
              register={register}
              error={errors.address}
              inputProps={{
                placeholder: "Dirección",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
              }}
            />

            {/* Blood type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Tipo de Sangre</label>
              <select
                {...register("bloodType")}
                className={`w-full p-3 border ${
                  errors.bloodType
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } rounded-md text-sm`}
              >
                <option value="">Seleccionar tipo de sangre</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.bloodType?.message && (
                <div className="flex items-start gap-1 mt-1">
                  <AlertCircle
                    size={14}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-500">
                    {errors.bloodType.message.toString()}
                  </p>
                </div>
              )}
            </div>

            {/* Sex */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Sexo</label>
              <select
                {...register("sex")}
                className={`w-full p-3 border ${
                  errors.sex ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-md text-sm`}
              >
                <option value={UserSex.MALE}>Masculino</option>
                <option value={UserSex.FEMALE}>Femenino</option>
              </select>
              {errors.sex?.message && (
                <p className="text-xs text-red-500">
                  {errors.sex.message.toString()}
                </p>
              )}
            </div>

            {/* Grade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Semestre</label>
              <select
                {...register("gradeId")}
                className={`w-full p-3 border ${
                  errors.gradeId
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } rounded-md text-sm`}
                defaultValue={data?.gradeId as any}
              >
                <option value="">Seleccionar Semestre</option>
                {grades.map((grade: any) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.level}
                  </option>
                ))}
              </select>
              {errors.gradeId?.message && (
                <p className="text-xs text-red-500">
                  {errors.gradeId.message.toString()}
                </p>
              )}
            </div>

            {/* Class */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Clase</label>
              <div className="relative">
                <div
                  className={`min-h-[44px] p-3 border ${
                    errors.classId
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } rounded-md text-sm cursor-pointer`}
                  onClick={() => setShowClassSelector((prev) => !prev)}
                >
                  {selectedClassName ? (
                    <span>{selectedClassName}</span>
                  ) : (
                    <span className="text-gray-400">Seleccionar clase</span>
                  )}
                </div>
                {showClassSelector && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar clases..."
                          className="w-full p-2 pl-8 border border-gray-200 rounded-md text-sm"
                          value={classSearchQuery}
                          onChange={(e) => setClassSearchQuery(e.target.value)}
                        />
                        <Search
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-2">
                      {filteredClasses.length > 0 ? (
                        filteredClasses.map((classItem: any) => (
                          <div
                            key={classItem.id}
                            className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                              String(watchClassId) === String(classItem.id)
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onClick={() => {
                              setValue("classId", classItem.id, {
                                shouldValidate: true,
                              });
                              setShowClassSelector(false);
                            }}
                          >
                            <span className="text-sm">{classItem.name}</span>
                            {String(watchClassId) === String(classItem.id) ? (
                              <Check size={16} className="text-green-500" />
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500 text-sm">
                          No hay clases disponibles
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 bg-gray-100 rounded-md"
                        onClick={() => setShowClassSelector(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.classId?.message && (
                <p className="text-xs text-red-500">
                  {errors.classId.message.toString()}
                </p>
              )}
            </div>

            {/* Birthday */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">
                Fecha de Nacimiento
                <span className="text-xs text-gray-400 ml-1">
                  (min. 5 años)
                </span>
              </label>
              <input
                {...register("birthday")}
                type="date"
                className={`w-full p-3 border ${
                  errors.birthday
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } rounded-md text-sm`}
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() - 5))
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) => {
                  register("birthday").onChange(e);
                  setBirthdayTouched(true);
                }}
              />
              {errors.birthday?.message && birthdayTouched && (
                <div className="flex items-start gap-1 mt-1">
                  <AlertCircle
                    size={14}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-500">
                    {errors.birthday.message.toString()}
                  </p>
                </div>
              )}
            </div>

            {/* Hidden Id field for update */}
            {data?.id !== undefined && (
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
            disabled={isPending || isSubmitting}
            className={`px-6 py-3 ${
              isPending || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800"
            } text-white rounded-md transition-colors`}
          >
            {isPending || isSubmitting
              ? "Procesando..."
              : type === "create"
              ? "Crear"
              : "Actualizar"}
          </button>
        </div>
      </form>
    </>
  );
};

export default StudentForm;
