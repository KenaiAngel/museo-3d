"use client";
import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useModal } from "../providers/ModalProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthModal() {
  const { modal, modalData, closeModal, isModalOpen } = useModal();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localMode, setLocalMode] = useState("login");
  const [success, setSuccess] = useState(false);
  const modalRef = useRef();

  // Determinar el modo basado en el modal abierto
  const isOpen = isModalOpen("auth-login") || isModalOpen("auth-register");
  const mode = isModalOpen("auth-register") ? "register" : "login";

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return;

    // Al abrir el modal, ir al top de la página instantáneamente
    window.scrollTo(0, 0);

    const handleKey = (e) => {
      if (e.key === "Escape" && !success) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    // Bloquear el scroll inmediatamente
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);

      // Restaurar el scroll
      document.body.style.overflow = "";
    };
  }, [isOpen, success]);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Limpiar el estado del modal
    setLocalMode("login");
    setForm({ email: "", password: "", name: "", confirmPassword: "" });
    setError("");
    setLoading(false);
    setShowPassword(false);

    // Cerrar el modal
    closeModal();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.email || !form.password) {
      const errorMsg = "Por favor, completa todos los campos";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }
    if (localMode === "register" && !form.name) {
      const errorMsg = "Por favor, ingresa tu nombre";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    if (localMode === "register" && form.password !== form.confirmPassword) {
      const errorMsg = "Las contraseñas no coinciden";
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    try {
      if (localMode === "register") {
        // Registro de usuario
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            name: form.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error || "Error al crear la cuenta";
          setError(errorMsg);
          toast.error(errorMsg);
          setLoading(false);
          return;
        }

        // Registro exitoso, hacer login automáticamente
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          const errorMsg =
            "Cuenta creada, pero error al iniciar sesión. Intenta hacer login.";
          setError(errorMsg);
          toast.warning(errorMsg);
          setSuccess(true);
        } else {
          toast.success("Cuenta creada e iniciada sesión correctamente");
          setSuccess(true);

          // Manejar redirección después del registro exitoso
          setTimeout(() => {
            const redirectTo =
              modalData?.redirectTo ||
              (typeof window !== "undefined"
                ? sessionStorage.getItem("redirectAfterLogin")
                : null);

            if (redirectTo && redirectTo !== "/") {
              // Limpiar el almacenamiento de redirección
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("redirectAfterLogin");
              }
              router.push(redirectTo);
            } else {
              // Recargar la página para actualizar el estado de autenticación
              window.location.reload();
            }
          }, 1200);
        }
      } else {
        // Login de usuario
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          const errorMsg = "Credenciales incorrectas";
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          toast.success("Sesión iniciada correctamente");
          setSuccess(true);

          // Manejar redirección después del login exitoso
          setTimeout(() => {
            const redirectTo =
              modalData?.redirectTo ||
              (typeof window !== "undefined"
                ? sessionStorage.getItem("redirectAfterLogin")
                : null);

            if (redirectTo && redirectTo !== "/") {
              // Limpiar el almacenamiento de redirección
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("redirectAfterLogin");
              }
              router.push(redirectTo);
            } else {
              // Recargar la página para actualizar el estado de autenticación
              window.location.reload();
            }
          }, 1200);
        }
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      const errorMsg = "Error de conexión. Intenta nuevamente.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Validaciones inteligentes
  const isEmailValid =
    form.email.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const isPasswordValid = form.password.length >= 6;
  const isConfirmValid =
    localMode === "register" &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;
  const isNameValid = localMode === "register" ? form.name.length > 2 : true;

  // Cierra el modal tras mostrar el éxito
  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => {
        setSuccess(false);
        closeModal();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [success, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[9999] bg-black/50 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <button
                onClick={handleClose}
                type="button"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer z-10"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {localMode === "login"
                    ? "Bienvenido de vuelta"
                    : "Crear cuenta"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {localMode === "login"
                    ? "Inicia sesión para continuar"
                    : "Únete para explorar el museo virtual"}
                </p>
              </div>
            </div>

            {/* Content animado entre modos */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <AnimatePresence mode="wait" initial={false}>
                {success ? (
                  <motion.div
                    key="success-message"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex flex-col items-center justify-center h-full min-h-[200px]"
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-soft-pulse" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      ¡Éxito!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      Tu autenticación fue exitosa.
                      <br />
                      Redirigiendo...
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key={localMode}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    initial={{ y: localMode === "login" ? 40 : -40 }}
                    animate={{ y: 0 }}
                    exit={{ y: localMode === "login" ? -40 : 40 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {/* Nombre (solo registro) */}
                    {localMode === "register" && (
                      <motion.div
                        initial={{ y: 16 }}
                        animate={{ y: 0 }}
                        exit={{ y: -16 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre completo
                        </label>
                        <div>
                          <div
                            className={`flex items-center border rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent w-full ${
                              form.name.length === 0
                                ? "border-gray-200 dark:border-gray-700"
                                : isNameValid
                                  ? "border-green-400 dark:border-green-500"
                                  : "border-red-400 dark:border-red-500"
                            }`}
                          >
                            <User className="w-5 h-5 text-gray-300 dark:text-gray-500 mr-2" />
                            <input
                              type="text"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              required
                              className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2"
                              placeholder="Tu nombre completo"
                              autoComplete="name"
                            />
                            {form.name.length > 0 && (
                              <>
                                {isNameValid ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500 ml-2 pointer-events-none" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-500 ml-2 pointer-events-none" />
                                )}
                              </>
                            )}
                          </div>
                          {form.name.length > 0 && (
                            <p
                              className={`text-xs mt-1 ${
                                isNameValid ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {isNameValid
                                ? "Nombre válido"
                                : "Introduce tu nombre completo"}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Email */}
                    <motion.div
                      initial={{ y: 16 }}
                      animate={{ y: 0 }}
                      exit={{ y: -16 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Correo electrónico
                      </label>
                      <div>
                        <div
                          className={`flex items-center border rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent w-full ${
                            form.email.length === 0
                              ? "border-gray-200 dark:border-gray-700"
                              : isEmailValid
                                ? "border-green-400 dark:border-green-500"
                                : "border-red-400 dark:border-red-500"
                          }`}
                        >
                          <Mail className="w-5 h-5 text-gray-300 dark:text-gray-500 mr-2" />
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2"
                            placeholder="tu@email.com"
                            autoComplete="email"
                          />
                          {form.email.length > 0 && (
                            <>
                              {isEmailValid ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 ml-2 pointer-events-none" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-500 ml-2 pointer-events-none" />
                              )}
                            </>
                          )}
                        </div>
                        {form.email.length > 0 && (
                          <p
                            className={`text-xs mt-1 ${
                              isEmailValid ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {isEmailValid
                              ? "Correo válido"
                              : "Introduce un correo válido"}
                          </p>
                        )}
                      </div>
                    </motion.div>

                    {/* Contraseña */}
                    <motion.div
                      initial={{ y: 16 }}
                      animate={{ y: 0 }}
                      exit={{ y: -16 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contraseña
                      </label>
                      <div>
                        <div
                          className={`flex items-center border rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent w-full ${
                            form.password.length === 0
                              ? "border-gray-200 dark:border-gray-700"
                              : isPasswordValid
                                ? "border-green-400 dark:border-green-500"
                                : "border-red-400 dark:border-red-500"
                          }`}
                        >
                          <Lock className="w-5 h-5 text-gray-300 dark:text-gray-500 mr-2" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2"
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          {form.password.length > 0 && (
                            <>
                              {isPasswordValid ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 ml-2 pointer-events-none" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-500 ml-2 pointer-events-none" />
                              )}
                            </>
                          )}
                        </div>
                        {form.password.length > 0 && (
                          <p
                            className={`text-xs mt-1 ${
                              isPasswordValid
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {isPasswordValid
                              ? "Contraseña válida"
                              : "Mínimo 6 caracteres"}
                          </p>
                        )}
                      </div>
                    </motion.div>

                    {/* Confirmar Contraseña (solo registro) */}
                    {localMode === "register" && (
                      <motion.div
                        initial={{ y: 16 }}
                        animate={{ y: 0 }}
                        exit={{ y: -16 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirmar contraseña
                        </label>
                        <div>
                          <div
                            className={`flex items-center border rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent w-full ${
                              form.confirmPassword.length === 0
                                ? "border-gray-200 dark:border-gray-700"
                                : isConfirmValid
                                  ? "border-green-400 dark:border-green-500"
                                  : "border-red-400 dark:border-red-500"
                            }`}
                          >
                            <Lock className="w-5 h-5 text-gray-300 dark:text-gray-500 mr-2" />
                            <input
                              type={showPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={form.confirmPassword}
                              onChange={handleChange}
                              required
                              minLength="6"
                              className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2"
                              placeholder="Confirma tu contraseña"
                              autoComplete="new-password"
                            />
                            {form.confirmPassword.length > 0 && (
                              <>
                                {isConfirmValid ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500 ml-2 pointer-events-none" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-500 ml-2 pointer-events-none" />
                                )}
                              </>
                            )}
                          </div>
                          {form.confirmPassword.length > 0 && (
                            <p
                              className={`text-xs mt-1 ${
                                isConfirmValid
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {isConfirmValid
                                ? "Las contraseñas coinciden"
                                : "Las contraseñas no coinciden"}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <span className="flex items-center gap-1 mr-2">
                            <span className="block w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0s]"></span>
                            <span className="block w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.15s]"></span>
                            <span className="block w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.3s]"></span>
                          </span>
                          Procesando...
                        </>
                      ) : localMode === "login" ? (
                        "Iniciar sesión"
                      ) : (
                        "Crear cuenta"
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                  o
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => {
                  const redirectTo =
                    modalData?.redirectTo ||
                    (typeof window !== "undefined"
                      ? sessionStorage.getItem("redirectAfterLogin")
                      : null);

                  // Si hay una URL de redirección, incluirla como callbackUrl
                  if (redirectTo && redirectTo !== "/") {
                    signIn("google", { callbackUrl: redirectTo });
                  } else {
                    signIn("google");
                  }
                }}
                className="w-full py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Continuar con Google
              </button>

              {/* Toggle Mode */}
              <div className="mt-6 text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {localMode === "login" ? (
                    <>
                      ¿No tienes cuenta?{" "}
                      <button
                        onClick={() => {
                          setLocalMode("register");
                          setError("");
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-all duration-200 cursor-pointer"
                      >
                        Crear una gratis
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        onClick={() => {
                          setLocalMode("login");
                          setError("");
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-all duration-200 cursor-pointer"
                      >
                        Iniciar sesión
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex space-x-2 mt-2">
                  <span className="block w-3 h-3 rounded-full bg-white dark:bg-gray-200 animate-bounce [animation-delay:0s]"></span>
                  <span className="block w-3 h-3 rounded-full bg-white dark:bg-gray-200 animate-bounce [animation-delay:0.15s]"></span>
                  <span className="block w-3 h-3 rounded-full bg-white dark:bg-gray-200 animate-bounce [animation-delay:0.3s]"></span>
                </div>
                <span className="mt-6 text-white dark:text-gray-200 font-medium text-lg tracking-wide">
                  Cargando...
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
