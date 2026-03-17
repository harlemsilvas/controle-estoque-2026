import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/apiBaseUrl";

const RecoverPage = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(buildApiUrl("/recuperar-senha"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Senha redefinida com sucesso!");
        navigate("/login");
      } else {
        toast.error(result.error || "Erro ao redefinir senha");
      }
    } catch (error) {
      toast.error("Erro na conexão com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <LockClosedIcon className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu email para receber o link de recuperação
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1 relative">
                <EnvelopeIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Nova Senha
              </label>
              <div className="mt-1 relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirme a Nova Senha
              </label>
              <div className="mt-1 relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-center text-gray-600">
            <p>
              Lembrou sua senha?{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Faça login aqui
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LockClosedIcon
                    className="h-5 w-5 text-blue-300"
                    aria-hidden="true"
                  />
                </span>
                Enviar Link de Recuperação
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecoverPage;

// import React, { useState } from "react";
// import { toast } from "react-toastify";

// const RecoverPage = () => {
// Código legado desativado - usar buildApiUrl para requisições
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const result = await response.json();
//       if (response.ok) {
//         toast.success(result.message);
//       } else {
//         toast.error(result.error || "Erro ao solicitar redefinição.");
//       }
//     } catch (error) {
//       toast.error("Erro ao processar a solicitação.");
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2>Recuperar Senha</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>
//         <button type="submit">Enviar Link de Recuperação</button>
//       </form>
//     </div>
//   );
// };

// export default RecoverPage;
