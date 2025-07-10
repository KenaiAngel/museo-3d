export default function EmailVerifySuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-white dark:from-neutral-900 dark:to-neutral-800">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <svg
          width="64"
          height="64"
          fill="none"
          viewBox="0 0 24 24"
          className="mb-4 text-green-500"
        >
          <path
            fill="currentColor"
            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm-1.293-6.707 7-7-1.414-1.414L10 12.586l-2.293-2.293-1.414 1.414 3 3a1 1 0 0 0 1.414 0Z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">
          ¡Correo verificado!
        </h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6 text-center">
          Tu correo electrónico ha sido verificado correctamente.
          <br />
          Ya puedes disfrutar de todas las funciones de Museo 3D.
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
