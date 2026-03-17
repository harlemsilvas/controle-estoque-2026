// src/components/NotFound.js
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Voltar para a página anterior ou para a home
      navigate(location.state?.from || "/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={"Página não encontrada !"} />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Ícone de alerta animado */}
          <div className="animate-pulse mb-8">
            <svg
              className="w-32 h-32 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Mensagem principal */}
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-2xl text-gray-600 mb-8">
            Oops! Página não encontrada
          </p>

          {/* Contagem regressiva visual */}
          <div className="relative pt-1 w-64 mx-auto mb-8">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-3000 ease-out"
                style={{ width: "100%" }}
              ></div>
            </div>
            <span className="text-sm text-gray-500">
              Redirecionando em 3 segundos...
            </span>
          </div>

          {/* Botão de ação alternativa */}
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar Agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
// import React from "react";

// const NotFound = () => {
//   return (
//     <div>
//       <h1>NotFound</h1>
//     </div>
//   );
// };

// export default NotFound;
