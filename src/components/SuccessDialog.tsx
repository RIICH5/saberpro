"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Copy, Download, User } from "lucide-react";
import html2canvas from "html2canvas";

interface TeacherData {
  name: string;
  surname: string;
  username: string;
  password: string;
  email: string;
  img?: string;
}

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teacherData: TeacherData;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  isOpen,
  onClose,
  teacherData,
}) => {
  const [copied, setCopied] = useState(false);
  const credentialsRef = useRef<HTMLDivElement>(null);

  // Debug rendering
  useEffect(() => {
    console.log("SuccessDialog: Rendered with isOpen:", isOpen);
    console.log("SuccessDialog: Teacher data:", teacherData);
  }, [isOpen, teacherData]);

  if (!isOpen) {
    console.log("SuccessDialog: Not showing due to !isOpen");
    return null;
  }

  const { name, surname, username, password, email, img } = teacherData;

  const copyToClipboard = () => {
    const text = `
      Nombre: ${name} ${surname}
      Número de Cuenta: ${username}
      Contraseña: ${password}
      Correo: ${email}
    `;

    navigator.clipboard.writeText(text.trim());
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const downloadAsImage = async () => {
    if (credentialsRef.current) {
      try {
        const canvas = await html2canvas(credentialsRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
        });

        const link = document.createElement("a");
        link.download = `credenciales-${username}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }
  };

  // Separate handle close to add logging
  const handleClose = () => {
    console.log("SuccessDialog: Close button clicked");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
      <div className="bg-white rounded-lg relative mx-4 my-8 md:mx-auto max-w-md w-full shadow-xl p-6 animate-fade-in">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <Check size={32} className="text-green-500" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-4">
          ¡Profesor creado exitosamente!
        </h2>

        <div
          ref={credentialsRef}
          className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-4"
        >
          <div className="flex gap-4 items-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {img ? (
                <img
                  src={img}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {name} {surname}
              </h3>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Número de Cuenta:</p>
              <p className="font-medium">{username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contraseña:</p>
              <p className="font-medium">{password}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center mb-4">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 py-2 px-4 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-all text-sm"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-500" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={downloadAsImage}
            className="flex items-center gap-2 py-2 px-4 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-all text-sm"
          >
            <Download size={16} />
            <span>Descargar</span>
          </button>
        </div>

        <p className="text-sm text-center text-gray-500 mb-4">
          Comparta estas credenciales con el profesor para que pueda iniciar
          sesión.
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="py-2 px-6 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Entendido
          </button>
        </div>

        <button
          className="absolute top-4 right-4 cursor-pointer hover:text-gray-700 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100"
          onClick={handleClose}
        >
          <X
            size={16}
            className="hover:rotate-90 transition-transform duration-300"
          />
        </button>
      </div>
    </div>
  );
};

export default SuccessDialog;
