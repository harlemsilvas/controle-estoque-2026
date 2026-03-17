// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    console.log("[AuthProvider] useEffect - storedUser:", storedUser);
    console.log("[AuthProvider] useEffect - storedToken:", storedToken);

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      if (validateToken(storedToken)) {
        setUser(parsedUser);
        console.log("[AuthProvider] useEffect - user setado:", parsedUser);
      } else {
        logout();
        console.log("[AuthProvider] useEffect - token inválido, logout");
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Função para login
  const login = async (userData, token) => {
    console.log("[AuthProvider] login - userData:", userData);
    setUser(userData); // Atualiza o estado do usuário
    localStorage.setItem("user", JSON.stringify(userData)); // Salva no localStorage
    localStorage.setItem("token", token); // Salva o token no localStorage
    console.log(
      "[AuthProvider] login - user salvo:",
      localStorage.getItem("user")
    );
  };

  // Função para logout
  const logout = () => {
    setUser(null); // Limpa o estado do usuário
    localStorage.removeItem("user"); // Remove do localStorage
    localStorage.removeItem("token"); // Remove o token do localStorage
  };

  // Função para validar o token (exemplo básico)
  const validateToken = (token) => {
    if (!token) {
      console.warn("[AuthProvider] validateToken: token ausente");
      return false;
    }
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("[AuthProvider] validateToken: token malformado", token);
        return false;
      }
      const payload = JSON.parse(atob(parts[1])); // Decodifica o token
      const isExpired = payload.exp * 1000 < Date.now(); // Verifica se o token expirou
      if (isExpired) {
        console.warn("[AuthProvider] validateToken: token expirado", payload);
      }
      return !isExpired; // Retorna true se o token for válido
    } catch (err) {
      console.error("[AuthProvider] Erro ao validar token:", err, token);
      return false;
    }
  };

  // Valida se o usuário está autenticado
  const isAuthenticated = !!user;

  if (loading) {
    return <div>Carregando...</div>; // Exibe um indicador de carregamento
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
