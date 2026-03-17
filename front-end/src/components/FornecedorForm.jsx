// src/components/FornecedorForm.jsx
import React, { useState, useEffect } from "react";

const FornecedorForm = ({
  fornecedor,
  onSave,
  onCancel,
  isEditing,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    CODIGO: "",
    NOME: "",
    CNPJ: "",
    TELEFONE: "",
    EMAIL: "",
    ENDERECO: "",
  });

  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    }
  }, [fornecedor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {/* {fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"} */}
          {fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}{" "}
          {/* Segunda tela */}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          Voltar para lista
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        {/* Campo CÓDIGO (visível apenas em edição ou após carregamento) */}
        <div className="space-y-4">
          {(fornecedor || formData.CODIGO) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código
              </label>
              <input
                type="text"
                value={formData.CODIGO}
                readOnly
                className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300 shadow-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome *
            </label>
            <input
              type="text"
              name="NOME"
              value={formData.NOME}
              onChange={(e) =>
                setFormData({ ...formData, NOME: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CNPJ *
            </label>
            <input
              type="text"
              name="CNPJ"
              value={formData.CNPJ}
              onChange={(e) =>
                setFormData({ ...formData, CNPJ: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              TELEFONE
            </label>
            <input
              type="text"
              name="TELEFONE"
              value={formData.TELEFONE}
              onChange={(e) =>
                setFormData({ ...formData, TELEFONE: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              EMAIL
            </label>
            <input
              type="text"
              name="EMAIL"
              value={formData.EMAIL}
              onChange={(e) =>
                setFormData({ ...formData, EMAIL: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              ENDEREÇO
            </label>
            <input
              type="text"
              name="ENDERECO"
              value={formData.ENDERECO}
              onChange={(e) =>
                setFormData({ ...formData, ENDERECO: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {fornecedor ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FornecedorForm;
