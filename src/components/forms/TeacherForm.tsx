"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useTransition,
  useMemo,
  useRef,
} from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { createTeacher, updateTeacher } from "@/lib/actions";
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
  Plus,
  Minus,
} from "lucide-react";
import SuccessDialog from "../SuccessDialog";
import { useErrorHandler, getFieldLabel } from "../../../hooks/errorHandling";

// Define enums to match Prisma schema
enum UserSex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// Blood type options
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface TeacherFormProps {
  type: "create" | "update";
  data?: Record<string, unknown>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    subjects?: Array<{ id: number; name: string }>;
    classes?: Array<{ id: number; name: string }>;
    [key: string]: unknown;
  };
  onComplete?: () => void;
  onSuccessDialogChange?: (isVisible: boolean) => void; // New prop to communicate success dialog state
}

interface TeacherData {
  name: string;
  surname: string;
  username: string;
  password: string;
  email: string;
  img?: string;
}

// Password validation states
interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

interface ClerkError {
  code: string;
  message: string;
  longMessage?: string;
  meta?: any;
}

// Define extended ActionState type that includes optional data property
interface ActionStateWithData {
  success: boolean;
  error: boolean;
  clerkErrors?: ClerkError[];
  prismaErrors?: Array<{
    code: string;
    field: string;
    message: string;
  }>;
  data?: {
    name: string;
    surname: string;
    username: string;
    password: string;
    email: string;
    img?: string;
  };
}

// Function to generate a random 6-digit ID
const generateRandomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const TeacherForm = ({
  type,
  data,
  setOpen,
  relatedData,
  onComplete,
  onSuccessDialogChange,
}: TeacherFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toastId, setToastId] = useState<string | number | null>(null);
  const [clerkErrors, setClerkErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<TeacherData | null>(
    null
  );
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);

  // Flag to track if form was successfully submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Ref to prevent multiple calls during state updates
  const notifiedParentRef = useRef(false);

  // Debug state changes
  useEffect(() => {
    console.log("TeacherForm: showSuccessDialog changed:", showSuccessDialog);
    console.log("TeacherForm: createdTeacher state:", createdTeacher);

    // This is crucial - only after both states are set properly, notify parent
    if (showSuccessDialog && createdTeacher && !notifiedParentRef.current) {
      console.log("TeacherForm: Both states ready, notifying parent");
      if (onSuccessDialogChange) {
        notifiedParentRef.current = true;
        onSuccessDialogChange(true);
      }
    }
  }, [showSuccessDialog, createdTeacher, onSuccessDialogChange]);

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
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      ...data,
      birthday:
        typeof data?.birthday === "string"
          ? new Date(data.birthday)
          : data?.birthday
          ? new Date(data.birthday as Date)
          : undefined,
      username: (data?.username as string) || "",
      sex: (data?.sex as UserSex) || UserSex.MALE,
      // Always set password to empty string for edit
      password: "",
      // Normalize arrays for subjects/classes
      subjects: Array.isArray(data?.subjects)
        ? data.subjects.map((s: any) =>
            typeof s === "object" && s !== null && "id" in s
              ? String(s.id)
              : String(s)
          )
        : [],
      classes: Array.isArray(data?.classes)
        ? data.classes.map((c: any) =>
            typeof c === "object" && c !== null && "id" in c
              ? String(c.id)
              : String(c)
          )
        : [],
    },
  });

  // Create the error handler
  const { handleServerErrors } = useErrorHandler(
    { setError, clearErrors },
    toastId
  );

  const [img, setImg] = useState<{ secure_url: string } | null>(
    data?.img ? { secure_url: data.img as string } : null
  );

  // Watch password for real-time validation
  const watchPassword = watch("password");
  const watchUsername = watch("username");
  const watchSubjects = watch("subjects");
  const watchClasses = watch("classes");
  const watchBirthday = watch("birthday");

  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidation>({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    });

  // Age validation
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

    return age >= 24;
  }, [watchBirthday]);

  // Generate a random ID when creating a new teacher
  useEffect(() => {
    if (type === "create" && !watchUsername) {
      setValue("username", generateRandomId());
    }
  }, [type, setValue, watchUsername]);

  // Update password validation in real-time
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

  // Track if birthday field has been touched
  const [birthdayTouched, setBirthdayTouched] = useState(false);

  // Validate age when birthday changes
  useEffect(() => {
    if (birthdayTouched) {
      if (!isValidAge && watchBirthday) {
        setError("birthday", {
          type: "manual",
          message: "El profesor debe tener al menos 24 años.",
        });
      } else {
        // Clear the error if the date is now valid
        if (watchBirthday) {
          clearErrors("birthday");
        }
      }
    }
  }, [isValidAge, watchBirthday, birthdayTouched, setError, clearErrors]);

  // Improved onSubmit function to fix issues
  const onSubmit = handleSubmit(async (formData) => {
    console.log("TeacherForm: Form submission started");

    // Age validation
    if (!isValidAge) {
      setError("birthday", {
        type: "manual",
        message: "El profesor debe tener al menos 24 años.",
      });
      return;
    }

    // Clear previous errors
    setClerkErrors({});
    clearErrors();

    // Show loading toast
    const id = toast.loading(
      type === "create" ? "Creando profesor..." : "Actualizando profesor..."
    );
    setToastId(id);

    // Reset notification ref on new submission
    notifiedParentRef.current = false;

    // Prepare form data for submission
    const formDataObj = new FormData();

    // Add all form fields to FormData
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "birthday") {
        formDataObj.append(key, new Date(value as Date).toISOString());
      } else if (key === "subjects" && Array.isArray(value)) {
        value.forEach((subjectId) => {
          formDataObj.append("subjects[]", subjectId);
        });
      } else if (key === "classes" && Array.isArray(value)) {
        value.forEach((classId) => {
          formDataObj.append("classes[]", classId);
        });
      } else if (value !== undefined && value !== null) {
        formDataObj.append(key, value.toString());
      }
    });

    // Add image if available
    if (img?.secure_url) {
      formDataObj.append("img", img.secure_url);
    }

    // Submit form using server action
    startTransition(async () => {
      try {
        // Initialize empty state object for the first parameter
        const initialState: ActionStateWithData = {
          success: false,
          error: false,
        };

        const result =
          type === "create"
            ? await createTeacher(initialState, formDataObj)
            : await updateTeacher(initialState, formDataObj);

        // Cast the result to our extended type that includes the data property
        const typedResult = result as ActionStateWithData;

        // Debug log the server response in detail
        console.log(
          "TeacherForm: Server response:",
          JSON.stringify(result, null, 2)
        );
        console.log(
          "TeacherForm: Data available in response:",
          typedResult?.data
        );

        if (typedResult.success) {
          // Update toast on success
          toast.update(id, {
            render: `¡Profesor ha sido ${
              type === "create" ? "creado" : "actualizado"
            }!`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });

          // For create operations, show success dialog
          if (type === "create") {
            console.log(
              "TeacherForm: Creation successful, preparing to show dialog"
            );
            setFormSubmitted(true);

            // Explicitly prepare the teacher data
            const teacherData: TeacherData = {
              name: formData.name,
              surname: formData.surname,
              username: formData.username,
              password: formData.password || "",
              email: formData.email || "",
              img: img?.secure_url,
            };

            // Important: Set the data first, then update the dialog visibility
            console.log("TeacherForm: Setting teacher data:", teacherData);
            setCreatedTeacher(teacherData);

            // Use setTimeout to ensure state updates properly in sequence
            setTimeout(() => {
              console.log("TeacherForm: Setting dialog visibility to true");
              setShowSuccessDialog(true);
            }, 0);

            // Reset the form but keep the dialog visible
            setTimeout(() => {
              if (formSubmitted) {
                reset();
              }
            }, 200);
          } else {
            // For update operations, close modal
            console.log("TeacherForm: Update successful, closing modal");
            setOpen(false);
          }

          // Run completion callback if provided
          if (onComplete) onComplete();
          router.refresh();
        } else {
          // Use the error handler to process server errors
          const errorMessage = handleServerErrors(typedResult);

          // Update toast with the error message
          toast.update(id, {
            render: errorMessage || "Ha ocurrido un error",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        }
      } catch (error: any) {
        console.error("TeacherForm: Error submitting form:", error);

        // Try to handle Prisma errors from the catch block
        if (error.code === "P2002" && error.meta?.target) {
          const fields = Array.isArray(error.meta.target)
            ? error.meta.target
            : [error.meta.target];
          const field = fields[0];
          const fieldName = getFieldLabel(field);

          // Set field-specific error
          setError(field as any, {
            type: "manual",
            message: `Este ${fieldName} ya está en uso. Por favor, utiliza otro.`,
          });

          // Update toast with specific error
          toast.update(id, {
            render: `Este ${fieldName} ya está en uso. Por favor, utiliza otro.`,
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        } else {
          // Generic error handling
          toast.update(id, {
            render: "Error al procesar la solicitud",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        }
      }
    });
  });

  // Safely access subjects from relatedData
  const subjects = relatedData?.subjects || [];
  const classes = relatedData?.classes || [];

  // Filter subjects based on search query
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(subjectSearchQuery.toLowerCase())
    );
  }, [subjects, subjectSearchQuery]);

  // Filter classes based on search query
  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) =>
      classItem.name.toLowerCase().includes(classSearchQuery.toLowerCase())
    );
  }, [classes, classSearchQuery]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Generate a random ID for the username
  const handleGenerateId = () => {
    setValue("username", generateRandomId());
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    const currentSubjects = getValues("subjects") || [];

    if (currentSubjects.includes(subjectId)) {
      setValue(
        "subjects",
        currentSubjects.filter((id) => id !== subjectId),
        { shouldValidate: true }
      );
    } else {
      setValue("subjects", [...currentSubjects, subjectId], {
        shouldValidate: true,
      });
    }
  };

  // Toggle class selection
  const toggleClass = (classId: string) => {
    const currentClasses = getValues("classes") || [];

    if (currentClasses.includes(classId)) {
      setValue(
        "classes",
        currentClasses.filter((id) => id !== classId),
        { shouldValidate: true }
      );
    } else {
      setValue("classes", [...currentClasses, classId], {
        shouldValidate: true,
      });
    }
  };

  // Determine if password is valid according to all requirements
  const isPasswordValid =
    passwordValidation.minLength &&
    passwordValidation.hasUppercase &&
    passwordValidation.hasLowercase &&
    passwordValidation.hasNumber;

  // Get selected subject names
  const selectedSubjectNames = useMemo(() => {
    return (
      watchSubjects
        ?.map((id) => {
          const subject = subjects.find((s) => String(s.id) === id);
          return subject ? subject.name : null;
        })
        .filter(Boolean) || []
    );
  }, [watchSubjects, subjects]);

  // Get selected class names
  const selectedClassNames = useMemo(() => {
    return (
      watchClasses
        ?.map((id) => {
          const classItem = classes.find((c) => String(c.id) === id);
          return classItem ? classItem.name : null;
        })
        .filter(Boolean) || []
    );
  }, [watchClasses, classes]);

  // Improved success dialog close handler
  const handleSuccessDialogClose = () => {
    console.log("TeacherForm: Success dialog closing");

    // First notify parent that dialog is closing
    if (onSuccessDialogChange) {
      onSuccessDialogChange(false);
    }

    // Reset notification ref
    notifiedParentRef.current = false;

    // Then close the dialog
    setShowSuccessDialog(false);

    // Wait for the animation to complete before closing the modal
    setTimeout(() => {
      console.log("TeacherForm: Closing modal after success dialog");
      setOpen(false);
    }, 300);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <>
      <form className="flex flex-col gap-8 py-3" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Crear nuevo profesor" : "Actualizar profesor"}
        </h1>

        {/* General error message */}
        {Object.keys(clerkErrors).length > 0 && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
            <AlertCircle
              size={18}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm text-red-700 font-medium">
                {clerkErrors.general ||
                  "Por favor corrige los errores en el formulario."}
              </p>
              {clerkErrors.general ? (
                <ul className="mt-1 list-disc list-inside text-xs text-red-600">
                  {Object.entries(clerkErrors)
                    .filter(([key]) => key !== "general")
                    .map(([key, message]) => (
                      <li key={key}>{message}</li>
                    ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}

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
              // Type assertion for result.info
              const info = result.info as { secure_url: string };
              setImg(info);
              // Widget will close automatically
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
          <div className="grid grid-cols-1 gap-4 mt-2">
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

            <InputField
              label="Correo Electrónico"
              name="email"
              register={register}
              error={errors?.email}
              inputProps={{
                placeholder: "Correo electrónico",
                className:
                  "w-full p-3 border border-gray-300 rounded-md text-sm",
                type: "email",
              }}
            />

            {/* Enhanced Password field with show/hide toggle and validation indicators */}
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
                      : isPasswordValid && watchPassword
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  } rounded-md text-sm`}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

              {/* Password requirements list with real-time validation */}
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

            {/* Enhanced Phone Field with validation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Teléfono</label>
              {(() => {
                const { onChange, ...rest } = register("phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "El teléfono debe tener 10 dígitos numéricos.",
                  },
                });
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
                  <AlertCircle
                    size={14}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-500">
                    {errors.phone.message.toString()}
                  </p>
                </div>
              )}
            </div>

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

            {/* Blood type as select */}
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

            {/* Enhanced Birthday Field with age validation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">
                Fecha de Nacimiento
                <span className="text-xs text-gray-400 ml-1">
                  (min. 24 años)
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
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 24)
                  )
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

            {data && (
              <InputField
                label="Id"
                name="id"
                register={register}
                error={errors?.id}
                hidden
              />
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600">Sexo</label>
              <select
                className={`w-full p-3 border ${
                  errors.sex ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-md text-sm`}
                {...register("sex")}
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

            {/* Enhanced Subject Selection */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs text-gray-600">Asignaturas</label>

              <div className="relative">
                <div
                  className={`min-h-[80px] p-3 border ${
                    errors.subjects
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } rounded-md text-sm cursor-pointer`}
                  onClick={() => setShowSubjectSelector((prev) => !prev)}
                >
                  {selectedSubjectNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjectNames.map((name, index) => {
                        const subjectId = watchSubjects![index];
                        return (
                          <div
                            key={name}
                            className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the dropdown
                                toggleSubject(subjectId);
                              }}
                              className="text-gray-400 hover:text-red-500 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">
                      Seleccionar asignaturas
                    </span>
                  )}
                </div>

                {showSubjectSelector && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar asignaturas..."
                          className="w-full p-2 pl-8 border border-gray-200 rounded-md text-sm"
                          value={subjectSearchQuery}
                          onChange={(e) =>
                            setSubjectSearchQuery(e.target.value)
                          }
                        />
                        <Search
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                      </div>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto p-2">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <div
                            key={subject.id}
                            className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                              watchSubjects?.includes(subject.id.toString())
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubject(subject.id.toString());
                            }}
                          >
                            <span className="text-sm">{subject.name}</span>
                            {watchSubjects?.includes(subject.id.toString()) ? (
                              <Minus size={16} className="text-red-500" />
                            ) : (
                              <Plus size={16} className="text-green-500" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500 text-sm">
                          No hay asignaturas disponibles
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 bg-gray-100 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSubjectSelector(false);
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errors.subjects?.message && (
                <p className="text-xs text-red-500">
                  {errors.subjects.message.toString()}
                </p>
              )}
            </div>

            {/* Enhanced Class Selection */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs text-gray-600">Clases</label>

              <div className="relative">
                <div
                  className={`min-h-[80px] p-3 border ${
                    errors.classes
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } rounded-md text-sm cursor-pointer`}
                  onClick={() => setShowClassSelector((prev) => !prev)}
                >
                  {selectedClassNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedClassNames.map((name, index) => {
                        const classId = watchClasses![index];
                        return (
                          <div
                            key={name}
                            className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the dropdown
                                toggleClass(classId);
                              }}
                              className="text-gray-400 hover:text-red-500 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">Seleccionar clases</span>
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
                        filteredClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                              watchClasses?.includes(classItem.id.toString())
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleClass(classItem.id.toString());
                            }}
                          >
                            <span className="text-sm">{classItem.name}</span>
                            {watchClasses?.includes(classItem.id.toString()) ? (
                              <Minus size={16} className="text-red-500" />
                            ) : (
                              <Plus size={16} className="text-green-500" />
                            )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClassSelector(false);
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errors.classes?.message && (
                <p className="text-xs text-red-500">
                  {errors.classes.message.toString()}
                </p>
              )}
            </div>
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
            disabled={
              isPending ||
              isSubmitting ||
              (type === "create" && !isPasswordValid)
            }
            className={`px-6 py-3 ${
              isPending ||
              isSubmitting ||
              (type === "create" && !isPasswordValid)
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

      {/* Success Dialog - Improved rendering with more robust condition */}
      {showSuccessDialog && createdTeacher && (
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={handleSuccessDialogClose}
          teacherData={createdTeacher}
        />
      )}
    </>
  );
};

export default TeacherForm;
