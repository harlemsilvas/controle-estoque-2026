// src/pages/AdminUsuarios.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  FaUserEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaRedo,
  FaLock,
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ username: "", email: "" });
  const [editRoleId, setEditRoleId] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [senhaModal, setSenhaModal] = useState({
    open: false,
    userId: null,
    newPassword: "",
    show: false,
  });
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });
  const [loading, setLoading] = useState(false);

  // Carregar lista de usuários
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao carregar usuários." });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo usuário
  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.post("/usuarios", novoUsuario);
      setMensagem({ tipo: "sucesso", texto: "Usuário criado com sucesso!" });
      fetchUsuarios();
      setNovoUsuario({ username: "", email: "", password: "" });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao criar usuário." });
    }
  };

  // Alterar senha
  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/usuarios/${senhaModal.userId}/senha`, {
        newPassword: senhaModal.newPassword,
      });
      setMensagem({ tipo: "sucesso", texto: "Senha alterada com sucesso!" });
      setSenhaModal({
        open: false,
        userId: null,
        newPassword: "",
        show: false,
      });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao alterar senha." });
    }
  };

  // Desativar/Reativar usuário
  const handleStatusUsuario = async (id, isActive) => {
    try {
      await api.put(`/usuarios/${id}/status`, { isActive });
      fetchUsuarios();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao atualizar status do usuário.",
      });
    }
  };

  // Editar usuário inline
  const handleEdit = (usuario) => {
    setEditId(usuario.id);
    setEditData({ username: usuario.username, email: usuario.email });
  };

  // Edição de role
  const handleEditRole = (usuario) => {
    setEditRoleId(usuario.id);
    setEditRoleValue(usuario.role || "user");
  };
  const handleEditRoleChange = (e) => {
    setEditRoleValue(e.target.value);
  };
  const handleEditRoleSave = async (id) => {
    try {
      await api.put(`/usuarios/${id}/role`, { role: editRoleValue });
      setMensagem({ tipo: "sucesso", texto: "Permissão atualizada!" });
      setEditRoleId(null);
      fetchUsuarios();
    } catch (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao atualizar permissão." });
    }
  };
  const handleEditRoleCancel = () => {
    setEditRoleId(null);
  };
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handleEditSave = async (id) => {
    try {
      await api.put(`/usuarios/${id}`, editData);
      setMensagem({ tipo: "sucesso", texto: "Usuário atualizado!" });
      setEditId(null);
      fetchUsuarios();
    } catch (error) {
      setMensagem({ tipo: "erro", texto: "Erro ao atualizar usuário." });
    }
  };
  const handleEditCancel = () => {
    setEditId(null);
  };

  // Modal de senha
  const openSenhaModal = (userId) =>
    setSenhaModal({ open: true, userId, newPassword: "", show: false });
  const closeSenhaModal = () =>
    setSenhaModal({ open: false, userId: null, newPassword: "", show: false });
  const toggleShowSenha = () => setSenhaModal((s) => ({ ...s, show: !s.show }));

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        <FaUser className="text-blue-500" /> Manutenção de Usuários
      </h1>

      {/* Mensagem de Feedback */}
      {mensagem.texto && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-md ${
            mensagem.tipo === "sucesso"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {mensagem.tipo === "sucesso" ? <FaCheck /> : <FaTimes />}{" "}
          {mensagem.texto}
        </div>
      )}

      {/* Criação de Usuário */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaUserPlus className="text-blue-500" /> Criar Novo Usuário
        </h2>
        <form
          onSubmit={handleCriarUsuario}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome de Usuário
            </label>
            <div className="relative">
              <FaUser className="absolute left-2 top-3 text-gray-400" />
              <input
                type="text"
                value={novoUsuario.username}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, username: e.target.value })
                }
                className="w-full pl-8 pr-2 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-2 top-3 text-gray-400" />
              <input
                type="email"
                value={novoUsuario.email}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, email: e.target.value })
                }
                className="w-full pl-8 pr-2 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <div className="relative">
              <FaLock className="absolute left-2 top-3 text-gray-400" />
              <input
                type="password"
                value={novoUsuario.password}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, password: e.target.value })
                }
                className="w-full pl-8 pr-2 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="col-span-1 md:col-span-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all flex items-center gap-2 justify-center"
          >
            <FaCheck /> Criar Usuário
          </button>
        </form>
      </div>

      {/* Modal de Alteração de Senha */}
      {senhaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={closeSenhaModal}
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaLock /> Alterar Senha
            </h2>
            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={senhaModal.show ? "text" : "password"}
                    value={senhaModal.newPassword}
                    onChange={(e) =>
                      setSenhaModal((s) => ({
                        ...s,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full pl-8 pr-10 py-2 border rounded-md"
                    required
                  />
                  <FaLock className="absolute left-2 top-3 text-gray-400" />
                  <button
                    type="button"
                    className="absolute right-2 top-2 text-gray-500"
                    onClick={toggleShowSenha}
                    tabIndex={-1}
                  >
                    {senhaModal.show ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 w-full justify-center"
              >
                <FaCheck /> Salvar Nova Senha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaUser className="text-blue-500" /> Lista de Usuários
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Usuário</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Permissão</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    Carregando...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="py-2 px-4">{usuario.id}</td>
                    <td className="py-2 px-4">
                      {editRoleId === usuario.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRoleValue}
                            onChange={handleEditRoleChange}
                            className="border rounded px-2 py-1"
                          >
                            <option value="user">Usuário</option>
                            <option value="admin">Administrador</option>
                          </select>
                          <button
                            onClick={() => handleEditRoleSave(usuario.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center"
                            title="Salvar"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={handleEditRoleCancel}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded flex items-center"
                            title="Cancelar"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            usuario.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {usuario.role === "admin"
                            ? "Administrador"
                            : "Usuário"}
                          <button
                            onClick={() => handleEditRole(usuario)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            title="Editar Permissão"
                          >
                            <FaUserEdit />
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {editId === usuario.id ? (
                        <input
                          name="username"
                          value={editData.username}
                          onChange={handleEditChange}
                          className="border rounded px-2 py-1 w-32"
                        />
                      ) : (
                        usuario.username
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {editId === usuario.id ? (
                        <input
                          name="email"
                          value={editData.email}
                          onChange={handleEditChange}
                          className="border rounded px-2 py-1 w-48"
                        />
                      ) : (
                        usuario.email
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          usuario.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {usuario.is_active ? <FaCheck /> : <FaTimes />}{" "}
                        {usuario.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-2 px-4 flex gap-2">
                      {editId === usuario.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(usuario.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center"
                            title="Salvar"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded flex items-center"
                            title="Cancelar"
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center"
                            title="Editar"
                          >
                            <FaUserEdit />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUsuario(
                                usuario.id,
                                !usuario.is_active
                              )
                            }
                            className={`px-2 py-1 rounded flex items-center ${
                              usuario.is_active
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                            title={usuario.is_active ? "Desativar" : "Ativar"}
                          >
                            {usuario.is_active ? <FaTrash /> : <FaRedo />}
                          </button>
                          <button
                            onClick={() => openSenhaModal(usuario.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded flex items-center"
                            title="Alterar Senha"
                          >
                            <FaLock />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsuarios;
