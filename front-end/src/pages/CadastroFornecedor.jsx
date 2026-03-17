import React, { useState } from "react";
import { api } from "../services/api"; // Importe sua instância Axios configurada
import { toastSuccess, toastError } from "../services/toast";

const CadastroFornecedor = () => {
  const [formData, setFormData] = useState({
    NOME: "",
    CNPJ: "",
    TELEFONE: "",
    EMAIL: "",
    ENDERECO: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Enviar dados para o backend
      await api.post("/fornecedor", formData);

      // Limpar o formulário após o cadastro
      setFormData({
        NOME: "",
        CNPJ: "",
        TELEFONE: "",
        EMAIL: "",
        ENDERECO: "",
      });

      toastSuccess("Fornecedor cadastrado com sucesso!");
    } catch (error) {
      console.error(
        "Erro ao cadastrar fornecedor:",
        error.response?.data || error.message
      );
      toastError("Erro ao cadastrar fornecedor.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cadastro de Fornecedor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="NOME" className="block font-medium">
            Nome:
          </label>
          <input
            type="text"
            id="NOME"
            name="NOME"
            value={formData.NOME}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="CNPJ" className="block font-medium">
            CNPJ:
          </label>
          <input
            type="text"
            id="CNPJ"
            name="CNPJ"
            value={formData.CNPJ}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="TELEFONE" className="block font-medium">
            Telefone:
          </label>
          <input
            type="text"
            id="TELEFONE"
            name="TELEFONE"
            value={formData.TELEFONE}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="EMAIL" className="block font-medium">
            Email:
          </label>
          <input
            type="email"
            id="EMAIL"
            name="EMAIL"
            value={formData.EMAIL}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="ENDERECO" className="block font-medium">
            Endereço:
          </label>
          <input
            type="text"
            id="ENDERECO"
            name="ENDERECO"
            value={formData.ENDERECO}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Cadastrar
        </button>
      </form>
    </div>
  );
};

export default CadastroFornecedor;
