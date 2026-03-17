import React, { useState, useEffect } from "react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { toastSuccess, toastError } from "../services/toast";
import {
  getFamilias,
  createFamilia,
  updateFamilia,
  deleteFamilia,
} from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";
import FamiliaForm from "../components/FamiliaForm";
import Header from "../components/Header";

const MODES = {
  LIST: "list",
  CREATE: "create",
  EDIT: "edit",
};

const FamiliaProdutoPage = () => {
  const [familias, setFamilias] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilia, setSelectedFamilia] = useState(null);
  const [mode, setMode] = useState(MODES.LIST);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [familiaToDelete, setFamiliaToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cascadePrompt, setCascadePrompt] = useState({
    open: false,
    count: 0,
    vinculos: [],
    onConfirm: null,
  });
  // Paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // Ordenação
  const [orderBy, setOrderBy] = useState("CODIGO");
  const [orderDir, setOrderDir] = useState("asc");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const loadFamilias = React.useCallback(async () => {
    try {
      const data = await getFamilias({
        page,
        limit,
        search: searchQuery,
        orderBy,
        orderDir,
      });
      if (!data || !Array.isArray(data.data)) {
        throw new Error("Formato inválido de famílias recebido");
      }
      setFamilias(data.data);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toastError(`Erro ao carregar famílias: ${error.message}`);
    }
  }, [page, limit, searchQuery, orderBy, orderDir]);

  useEffect(() => {
    loadFamilias();
  }, [loadFamilias]);

  const handleSave = async (familiaData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!familiaData.DESCRICAO?.trim()) {
        throw new Error("A descrição da família é obrigatória");
      }
      if (mode === MODES.CREATE) {
        await createFamilia(familiaData);
        toastSuccess("Família criada com sucesso!");
      } else {
        await updateFamilia(selectedFamilia.CODIGO, familiaData);
        toastSuccess("Família atualizada com sucesso!");
      }
      setMode(MODES.LIST);
      loadFamilias();
    } catch (error) {
      toastError(error.message || "Erro ao salvar família");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (force = false) => {
    try {
      if (!familiaToDelete) return;
      const result = await deleteFamilia(familiaToDelete, force);
      if (result && result.vinculos) {
        setCascadePrompt({
          open: true,
          count: result.vinculos.length,
          vinculos: result.vinculos,
          onConfirm: async () => {
            setCascadePrompt({
              open: false,
              count: 0,
              vinculos: [],
              onConfirm: null,
            });
            await handleDeleteConfirm(true);
          },
        });
        return;
      }
      toastSuccess("Família excluída com sucesso!");
      loadFamilias();
    } catch (error) {
      toastError(`Erro ao excluir família: ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setFamiliaToDelete(null);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        {mode === MODES.LIST ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Famílias de Produtos
              </h1>
              <button
                onClick={() => setMode(MODES.CREATE)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Criar nova família"
              >
                Nova Família
              </button>
            </div>

            {/* Campo de busca */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Campo de busca por nome da família"
              />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                      onClick={() => {
                        if (orderBy === "CODIGO") {
                          setOrderDir(orderDir === "asc" ? "desc" : "asc");
                        } else {
                          setOrderBy("CODIGO");
                          setOrderDir("asc");
                        }
                      }}
                    >
                      <span className="flex items-center gap-1">
                        Código
                        {orderBy === "CODIGO" ? (
                          orderDir === "asc" ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                      onClick={() => {
                        if (orderBy === "DESCRICAO") {
                          setOrderDir(orderDir === "asc" ? "desc" : "asc");
                        } else {
                          setOrderBy("DESCRICAO");
                          setOrderDir("asc");
                        }
                      }}
                    >
                      <span className="flex items-center gap-1">
                        Descrição
                        {orderBy === "DESCRICAO" ? (
                          orderDir === "asc" ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )}
                      </span>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {familias.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Nenhuma família encontrada
                      </td>
                    </tr>
                  ) : (
                    familias.map((familia) => (
                      <tr key={familia.CODIGO}>
                        <td className="px-6 py-4">{familia.CODIGO}</td>
                        <td className="px-6 py-4">{familia.DESCRICAO}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedFamilia(familia);
                              setMode(MODES.EDIT);
                            }}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={`Editar família ${familia.DESCRICAO}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setFamiliaToDelete(familia.CODIGO);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Excluir família ${familia.DESCRICAO}`}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de paginação */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-600">
                Página {page} de {totalPages} ({total} famílias)
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              <div>
                <label className="mr-2">Itens por página:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded p-1"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <FamiliaForm
            familia={mode === MODES.EDIT ? selectedFamilia : null}
            onSave={handleSave}
            onCancel={() => setMode(MODES.LIST)}
            isSubmitting={isSubmitting}
            isEditing={false}
          />
        )}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDeleteConfirm(false)}
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta família permanentemente?"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
        {/* Modal para exclusão em cascata */}
        <ConfirmationModal
          isOpen={cascadePrompt.open}
          onClose={() =>
            setCascadePrompt({
              open: false,
              count: 0,
              vinculos: [],
              onConfirm: null,
            })
          }
          onConfirm={cascadePrompt.onConfirm}
          title="Excluir em Cascata"
          confirmText="Excluir em Cascata"
          cancelText="Cancelar"
          message={
            <div>
              <div className="mb-2">
                Esta família possui <b>{cascadePrompt.vinculos?.length || 0}</b>{" "}
                registros vinculados. Deseja excluir em cascata?
              </div>
              {cascadePrompt.vinculos && cascadePrompt.vinculos.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded bg-gray-50">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Código</th>
                        <th className="px-2 py-1 text-left">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cascadePrompt.vinculos.map((prod) => (
                        <tr key={prod.CODIGO}>
                          <td className="px-2 py-1">{prod.CODIGO}</td>
                          <td className="px-2 py-1">{prod.DESCRICAO}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          }
        />
      </div>
    </>
  );
};

export default FamiliaProdutoPage;
