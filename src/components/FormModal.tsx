"use client";

import {
  deleteClass,
  deleteExam,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import { Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface FormModalProps {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: Record<string, unknown>;
  id?: number | string;
  relatedData?: Record<string, unknown>;
  teacherInfo?: {
    name: string;
    username: string;
  };
  userRole?: string;
  onComplete?: () => void;
}

type ActionState = {
  success: boolean;
  error: boolean;
  clerkErrors?: unknown[] | null;
};

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  parent: deleteSubject,
  lesson: deleteSubject,
  assignment: deleteSubject,
  result: deleteSubject,
  attendance: deleteSubject,
  event: deleteSubject,
  announcement: deleteSubject,
};

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  ),
});

const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  ),
});

const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  ),
});

const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  ),
});

const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  ),
});

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: Record<string, unknown>,
    relatedData?: Record<string, unknown>,
    onComplete?: () => void
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData, onComplete) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      onComplete={onComplete}
    />
  ),
  class: (setOpen, type, data, relatedData, onComplete) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      onComplete={onComplete}
    />
  ),
  teacher: (setOpen, type, data, relatedData, onComplete) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      onComplete={onComplete}
    />
  ),
  student: (setOpen, type, data, relatedData, onComplete) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      onComplete={onComplete}
    />
  ),
  exam: (setOpen, type, data, relatedData, onComplete) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
      onComplete={onComplete}
    />
  ),
};

const tableTranslations: Record<string, string> = {
  teacher: "maestro",
  student: "estudiante",
  parent: "padre",
  subject: "asignatura",
  class: "clase",
  lesson: "lección",
  exam: "examen",
  assignment: "tarea",
  result: "resultado",
  attendance: "asistencia",
  event: "evento",
  announcement: "anuncio",
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
  teacherInfo,
  userRole,
  onComplete,
}: FormModalProps) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-gray-100"
      : type === "update"
      ? "bg-gray-100"
      : "bg-red-500";
  const iconColor = type === "delete" ? "text-white" : "text-gray-600";

  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showingSuccessDialog, setShowingSuccessDialog] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSuccessDialogVisibilityChange = (isVisible: boolean) => {
    setShowingSuccessDialog(isVisible);
  };

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (!showingSuccessDialog) {
      setOpen(false);
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, showingSuccessDialog]);

  const Form = () => {
    const initialState: ActionState = {
      success: false,
      error: false,
      clerkErrors: null,
    };

    const handleDelete = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsDeleting(true);

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      await toast.promise(deleteActionMap[table](initialState, formData), {
        pending: `Eliminando ${tableTranslations[table]}...`,
        success: `${teacherInfo?.name || "El registro"} ha sido eliminado`,
        error: "Error al eliminar. Intente nuevamente.",
      });

      setOpen(false);
      setIsDeleting(false);
      if (onComplete) onComplete();
    };

    return type === "delete" && id ? (
      <form onSubmit={handleDelete} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
            <AlertTriangle className="animate-pulse" size={24} />
          </div>
          <h2 className="text-lg font-medium text-gray-800 mb-1">
            Confirmar eliminación
          </h2>
          {teacherInfo && (
            <div className="text-center mb-3">
              <p className="font-medium text-gray-800">{teacherInfo.name}</p>
            </div>
          )}
          <span className="text-center text-gray-600">
            Todos los datos relacionados con este {tableTranslations[table]} se
            perderán permanentemente.
          </span>
          <p className="text-center text-gray-600 mt-2">
            ¿Estás seguro que deseas eliminar?
          </p>
        </div>

        <div className="flex gap-3 mt-2 justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-4 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 rounded-md border-none w-max self-center hover:bg-red-600 transition-all duration-200 font-medium flex items-center gap-2 group"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2
                  size={16}
                  className="group-hover:rotate-12 transition-transform duration-300"
                />
                <span>Eliminar</span>
              </>
            )}
          </button>
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      table === "teacher" ? (
        <TeacherForm
          type={type as "create" | "update"}
          data={data}
          setOpen={setOpen}
          relatedData={relatedData}
          onComplete={onComplete}
          onSuccessDialogChange={handleSuccessDialogVisibilityChange}
        />
      ) : (
        forms[table](setOpen, type, data, relatedData, onComplete)
      )
    ) : (
      <div className="p-4 text-center text-gray-500">
        ¡Formulario no encontrado!
      </div>
    );
  };

  const ActionIcon =
    type === "create" ? Plus : type === "update" ? Pencil : Trash2;

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} transition-all duration-200 hover:scale-110 active:scale-95`}
        onClick={handleOpen}
      >
        <ActionIcon
          size={16}
          className={`${iconColor} ${
            type === "delete"
              ? "hover:rotate-12 transition-transform duration-300"
              : ""
          }`}
        />
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center transition-all duration-300 backdrop-blur-sm overflow-y-auto">
          <div
            ref={modalRef}
            className="bg-white rounded-lg relative mx-4 my-8 md:mx-auto max-w-3xl w-full shadow-xl max-h-[90vh] overflow-auto p-4"
            style={{ maxHeight: "calc(100vh - 80px)" }}
          >
            <Form />
            {!showingSuccessDialog && (
              <button
                className="absolute top-4 right-4 cursor-pointer hover:text-gray-700 transition-all duration-200 rounded-full w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-100 z-10"
                onClick={handleClose}
              >
                <X
                  size={14}
                  className="hover:rotate-90 transition-transform duration-300"
                />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
