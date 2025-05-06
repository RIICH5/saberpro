"use client";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

// Helper function to get human-readable field labels - now exported
export const getFieldLabel = (field: string): string => {
  const fieldLabels: Record<string, string> = {
    username: "número de cuenta",
    email: "correo electrónico",
    password: "contraseña",
    phone: "número de teléfono",
    name: "nombre",
    surname: "apellido",
    address: "dirección",
  };

  return fieldLabels[field] || field;
};

// Generic error handling functions for forms
export const handlePrismaErrors = (error: any, setError: any) => {
  // Handle Prisma errors by mapping code and meta data to appropriate form fields
  if (error && typeof error === "object" && "code" in error) {
    // Process unique constraint violations (P2002)
    if (error.code === "P2002" && error.meta?.target) {
      const fields = Array.isArray(error.meta.target)
        ? error.meta.target
        : [error.meta.target];

      fields.forEach((field: string) => {
        setError(field, {
          type: "manual",
          message: `Este ${getFieldLabel(
            field
          )} ya está en uso. Por favor, utiliza otro.`,
        });
      });

      // Return user-friendly message for toast
      return `Ya existe un registro con este ${getFieldLabel(fields[0])}.`;
    }

    // Process validation errors (P2003)
    if (error.code === "P2003" && error.meta?.field_name) {
      const field = error.meta.field_name as string;
      setError(field, {
        type: "manual",
        message: `Valor inválido para ${getFieldLabel(field)}.`,
      });

      return `Valor inválido para ${getFieldLabel(field)}.`;
    }
  }

  // Default generic error message
  return "Ha ocurrido un error al procesar la solicitud.";
};

export const handleClerkErrors = (errors: any[], setError: any) => {
  const errorMessages: string[] = [];

  errors.forEach((err) => {
    let field = "";
    let message = "";

    // Map error codes to field names and messages
    switch (err.code) {
      case "form_identifier_exists":
        if (err.meta?.identifier_type === "username") {
          field = "username";
          message =
            "Este no. de cuenta ya está en uso. Por favor, utiliza otro.";
        } else if (err.meta?.identifier_type === "email_address") {
          field = "email";
          message =
            "Este correo electrónico ya está en uso. Por favor, utiliza otro.";
        } else {
          message =
            "Este identificador ya está en uso. Por favor, utiliza otro.";
        }
        break;

      case "form_param_unknown":
        // Handle unknown parameters - this is usually a coding error, not user error
        message =
          "Error en el formulario. Por favor, contacta al administrador.";
        if (err.meta?.param_name) {
          console.error(`Unknown parameter: ${err.meta.param_name}`);
        }
        break;

      case "form_username_invalid_character":
        field = "username";
        message = "El número de cuenta solo puede contener números.";
        break;

      case "form_password_pwned":
        field = "password";
        message =
          "Esta contraseña no es segura. Por favor, usa una contraseña diferente.";
        break;

      case "form_password_requirements":
        field = "password";
        message =
          err.longMessage ||
          "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número";
        break;

      case "form_email_invalid":
        field = "email";
        message = "El correo electrónico no es válido.";
        break;

      default:
        message = localizeClerkError(err.code, err.message);
        break;
    }

    // Set error on field if a field was identified
    if (field) {
      setError(field, {
        type: "manual",
        message: message,
      });
    }

    // Add to error messages list
    errorMessages.push(message);
  });

  // Return first error message for toast or generic message if none found
  return errorMessages.length > 0
    ? errorMessages[0]
    : "Ha ocurrido un error de validación.";
};

// Helper function to localize Clerk error messages
export const localizeClerkError = (
  code: string,
  defaultMessage: string
): string => {
  switch (code) {
    case "form_identifier_exists":
      return "Este identificador ya está en uso. Por favor, utiliza otro.";
    case "form_username_invalid_character":
      return "El no de cuenta contiene caracteres inválidos.";
    case "form_password_pwned":
      return "Esta contraseña no es segura. Por favor, usa una contraseña diferente.";
    case "form_password_requirements":
      return "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula y un número.";
    case "form_email_invalid":
      return "El correo electrónico no es válido.";
    case "form_param_unknown":
      return "Error en la estructura del formulario. Por favor, contacta al administrador.";
    case "form_param_invalid":
      return "Valor inválido en el formulario.";
    default:
      return defaultMessage || "Error de validación";
  }
};

// A hook for dynamic error handling
export const useErrorHandler = (
  formMethods: any,
  toastId: string | number | null
) => {
  const { setError, clearErrors } = formMethods;

  const handleServerErrors = (result: any) => {
    let errorMessage = "Ha ocurrido un error";
    let handledError = false;

    // Clear previous errors
    clearErrors();

    // Process Prisma errors
    if (result.prismaErrors && result.prismaErrors.length > 0) {
      handledError = true;

      // Process each prisma error
      result.prismaErrors.forEach((prismaError: any) => {
        if (prismaError.field) {
          setError(prismaError.field, {
            type: "manual",
            message: prismaError.message,
          });
        }
      });

      // Set error message for toast
      errorMessage = result.prismaErrors[0].message;
    }
    // Process Clerk errors
    else if (result.clerkErrors) {
      handledError = true;
      errorMessage = handleClerkErrors(result.clerkErrors, setError);
    }

    // Update toast with error message
    if (toastId !== null) {
      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }

    return errorMessage;
  };

  return { handleServerErrors };
};
