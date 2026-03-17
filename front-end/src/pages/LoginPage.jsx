import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../config/apiBaseUrl";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função handleLogin
  const handleLogin = async (credentials) => {
    try {
      const response = await fetch(buildApiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Backend pode retornar HTML (ex.: 502 do IIS), então evita parse JSON cego.
        const responseText = await response.text();
        let backendMessage = "";

        try {
          const parsed = JSON.parse(responseText);
          backendMessage = parsed?.error || parsed?.message || "";
        } catch {
          backendMessage = "";
        }

        if (response.status >= 500) {
          throw new Error(
            backendMessage || "Servidor indisponível no momento. Tente novamente.",
          );
        }

        throw new Error(backendMessage || "Credenciais inválidas");
      }

      const data = await response.json();

      // Armazena o token e os dados do usuário
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data; // Retorna os dados para o handleSubmit
    } catch (error) {
      console.error(error.message);
      throw error; // Propaga o erro para o handleSubmit
    }
  };

  // Função handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Chama handleLogin com os dados do formulário
      const data = await handleLogin(formData);

      // Atualiza o contexto de autenticação com user e token
      if (data && data.user && data.token) {
        await login(data.user, data.token);
      }
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard"); // Redireciona apenas em caso de sucesso
    } catch (error) {
      toast.error(error.message || "Erro ao realizar login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <LockClosedIcon
            className="mx-auto h-12 w-12 text-blue-600 animate-bounce"
            style={{
              width: 48,
              height: 48,
              maxWidth: "none",
              maxHeight: "none",
            }}
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              crie uma nova conta
            </a>
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
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Lembrar de mim
              </label>
            </div>

            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>
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
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { LockClosedIcon } from "@heroicons/react/24/outline";

// const LoginPage = () => {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//       if (!response.ok) {
//         throw new Error("Erro ao fazer login.");
//       }

//       const data = await response.json();

//       // Armazena o token e os dados do usuário
//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       // Redireciona ou atualiza o estado do aplicativo
//       navigate("/dashboard");
//     } catch (error) {
//       console.error(error.message);
//       toast.error("Erro ao realizar login. Verifique suas credenciais.");
//     }
//   };

//   // Função handleSubmit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       // Chama handleLogin com os dados do formulário
//       await handleLogin(formData);
//       toast.success("Login realizado com sucesso!");
//     } catch (error) {
//       toast.error("Erro na conexão com o servidor");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
//         <div className="text-center">
//           <LockClosedIcon className="mx-auto h-12 w-12 text-blue-600 animate-bounce" />
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             Acesse sua conta
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             Ou{" "}
//             <a
//               href="/register"
//               className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
//             >
//               crie uma nova conta
//             </a>
//           </p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="rounded-md shadow-sm space-y-4">
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Email
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
//                 placeholder="seu@email.com"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Senha
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 autoComplete="current-password"
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
//                 placeholder="••••••••"
//               />
//             </div>
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <input
//                 id="remember-me"
//                 name="remember-me"
//                 type="checkbox"
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label
//                 htmlFor="remember-me"
//                 className="ml-2 block text-sm text-gray-900"
//               >
//                 Lembrar de mim
//               </label>
//             </div>

//             <div className="text-sm">
//               <a
//                 href="/forgot-password"
//                 className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
//               >
//                 Esqueceu a senha?
//               </a>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
//           >
//             {isSubmitting ? (
//               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//             ) : (
//               <>
//                 <span className="absolute left-0 inset-y-0 flex items-center pl-3">
//                   <LockClosedIcon
//                     className="h-5 w-5 text-blue-300"
//                     aria-hidden="true"
//                   />
//                 </span>
//                 Entrar
//               </>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
// // import React, { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { toast } from "react-toastify";
// // import { LockClosedIcon } from "@heroicons/react/24/outline";

// // const LoginPage = () => {
// //   const [formData, setFormData] = useState({ email: "", password: "" });
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const navigate = useNavigate();

// Código legado desativado - usar autenticação via AuthContext
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(formData),
// //       });

// //       const result = await response.json();
// //       if (response.ok) {
// //         localStorage.setItem("token", result.token);
// //         toast.success("Login realizado com sucesso!");
// //         navigate("/dashboard");
// //       } else {
// //         toast.error(result.error || "Credenciais inválidas");
// //       }
// //     } catch (error) {
// //       toast.error("Erro na conexão com o servidor");
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
// //       <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
// //         <div className="text-center">
// //           <LockClosedIcon className="mx-auto h-12 w-12 text-blue-600 animate-bounce" />
// //           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
// //             Acesse sua conta
// //           </h2>
// //           <p className="mt-2 text-center text-sm text-gray-600">
// //             Ou{" "}
// //             <a
// //               href="/register"
// //               className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
// //             >
// //               crie uma nova conta
// //             </a>
// //           </p>
// //         </div>

// //         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
// //           <div className="rounded-md shadow-sm space-y-4">
// //             <div>
// //               <label
// //                 htmlFor="email"
// //                 className="block text-sm font-medium text-gray-700"
// //               >
// //                 Email
// //               </label>
// //               <input
// //                 id="email"
// //                 name="email"
// //                 type="email"
// //                 autoComplete="email"
// //                 required
// //                 value={formData.email}
// //                 onChange={handleChange}
// //                 className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
// //                 placeholder="seu@email.com"
// //               />
// //             </div>

// //             <div>
// //               <label
// //                 htmlFor="password"
// //                 className="block text-sm font-medium text-gray-700"
// //               >
// //                 Senha
// //               </label>
// //               <input
// //                 id="password"
// //                 name="password"
// //                 type="password"
// //                 autoComplete="current-password"
// //                 required
// //                 value={formData.password}
// //                 onChange={handleChange}
// //                 className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
// //                 placeholder="••••••••"
// //               />
// //             </div>
// //           </div>

// //           <div className="flex items-center justify-between">
// //             <div className="flex items-center">
// //               <input
// //                 id="remember-me"
// //                 name="remember-me"
// //                 type="checkbox"
// //                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
// //               />
// //               <label
// //                 htmlFor="remember-me"
// //                 className="ml-2 block text-sm text-gray-900"
// //               >
// //                 Lembrar de mim
// //               </label>
// //             </div>

// //             <div className="text-sm">
// //               <a
// //                 href="/forgot-password"
// //                 className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
// //               >
// //                 Esqueceu a senha?
// //               </a>
// //             </div>
// //           </div>

// //           <button
// //             type="submit"
// //             disabled={isSubmitting}
// //             className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
// //           >
// //             {isSubmitting ? (
// //               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
// //             ) : (
// //               <>
// //                 <span className="absolute left-0 inset-y-0 flex items-center pl-3">
// //                   <LockClosedIcon
// //                     className="h-5 w-5 text-blue-300"
// //                     aria-hidden="true"
// //                   />
// //                 </span>
// //                 Entrar
// //               </>
// //             )}
// //           </button>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // };

// // export default LoginPage;
