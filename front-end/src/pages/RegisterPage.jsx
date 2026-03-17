import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { buildApiUrl } from "../config/apiBaseUrl";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/usuarios"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let result = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = { message: await response.text() };
      }

      if (response.ok) {
        toast.success("Conta criada com sucesso!");
        navigate("/login");
      } else {
        toast.error(result.error || "Erro ao criar conta");
      }
    } catch (error) {
      console.error(error);
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

          <UserCircleIcon className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar Nova Conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Faça login aqui
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Nome de Usuário
              </label>
              <div className="mt-1 relative">
                <UserCircleIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="john_doe"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="mt-1 relative">
                <LockClosedIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
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
                Confirme a Senha
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

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              Concordo com os{" "}
              <a href="/terms" className="text-blue-600 hover:text-blue-500">
                Termos de Serviço
              </a>
            </label>
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
                Criar Conta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
