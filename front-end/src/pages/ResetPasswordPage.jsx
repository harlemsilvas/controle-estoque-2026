import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LockClosedIcon,
  ArrowLeftIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { buildApiUrl } from "../config/apiBaseUrl";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

          <KeyIcon className="mx-auto h-16 w-16 text-blue-600 animate-bounce" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar Nova Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sua nova senha deve ser diferente das anteriores
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
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
                  value={formData.newPassword}
                  onChange={handleChange}
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="text-center">
              Dica: Use pelo menos 8 caracteres com letras e números
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
                  <KeyIcon
                    className="h-5 w-5 text-blue-300"
                    aria-hidden="true"
                  />
                </span>
                Redefinir Senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

// import React, { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { toast } from "react-toastify";

// const ResetPasswordPage = () => {
//   const { token } = useParams();
//   const [newPassword, setNewPassword] = useState("");
//   const navigate = useNavigate();

// Código legado desativado - usar buildApiUrl para requisições
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, newPassword }),
//       });

//       const result = await response.json();
//       if (response.ok) {
//         toast.success(result.message);
//         navigate("/login");
//       } else {
//         toast.error(result.error || "Erro ao redefinir senha.");
//       }
//     } catch (error) {
//       toast.error(error.message || "Erro ao processar a solicitação.");
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2>Redefinir Senha</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="newPassword">Nova Senha</label>
//           <input
//             type="password"
//             id="newPassword"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             required
//           />
//         </div>
//         <button type="submit">Redefinir Senha</button>
//       </form>
//     </div>
//   );
// };

// export default ResetPasswordPage;
