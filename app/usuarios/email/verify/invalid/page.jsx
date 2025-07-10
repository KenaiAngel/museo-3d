export default function EmailVerifyInvalid() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-100 to-white dark:from-neutral-900 dark:to-neutral-800">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <svg
          width="64"
          height="64"
          fill="none"
          viewBox="0 0 24 24"
          className="mb-4 text-red-500"
        >
          <path
            fill="currentColor"
            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm-1-6h2v2h-2v-2Zm0-8h2v6h-2V8Z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-2 text-red-700 dark:text-red-400">
          Token inválido o expirado
        </h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6 text-center">
          El enlace de verificación no es válido o ha expirado.
          <br />
          Puedes solicitar un nuevo email de verificación desde tu perfil.
        </p>
        <a
          href="/perfil"
          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
        >
          Ir a mi perfil
        </a>
      </div>
    </div>
  );
}
