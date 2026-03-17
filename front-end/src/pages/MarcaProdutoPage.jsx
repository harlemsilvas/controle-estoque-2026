import React, { useState, useEffect } from "react";
import { toastSuccess, toastError } from "../services/toast";
import {
  getMarcas,
  deleteMarca,
  createMarca,
  updateMarca,
} from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";
import MarcaForm from "../components/MarcaForm";
import Header from "../components/Header";
import MarcasTable from "../components/MarcasTable";

const MODES = {
  LIST: "list",
  CREATE: "create",
  EDIT: "edit",
};

const MarcaProdutoPage = () => {
  const [marcas, setMarcas] = useState([]);
  // Removido filteredMarcas, filtro será feito inline
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [mode, setMode] = useState(MODES.LIST);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [marcaToDelete, setMarcaToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [marcaForceDelete, setMarcaForceDelete] = useState(null);
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Função para atualizar o filtro de busca
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Sempre volta para página 1 ao buscar
  };

  const loadMarcas = async () => {
    try {
      const data = await getMarcas({ page, limit, search: searchQuery });
      if (!data || !Array.isArray(data.data)) {
        throw new Error("Formato inválido de marcas recebido");
      }
      setMarcas(data.data);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toastError(`Erro ao carregar marcas: ${error.message}`);
    }
  };

  const handleSave = async (marcaData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!marcaData.DESCRICAO?.trim()) {
        throw new Error("A descrição da marca é obrigatória");
      }

      if (mode === MODES.CREATE) {
        await createMarca(marcaData);
        toastSuccess("Marca criada com sucesso!");
      } else {
        await updateMarca(selectedMarca.CODIGO, marcaData);
        toastSuccess("Marca atualizada com sucesso!");
      }

      setMode(MODES.LIST);
      loadMarcas();
    } catch (error) {
      toastError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!marcaToDelete) return;
      await deleteMarca(marcaToDelete);
      toastSuccess("Marca excluída com sucesso!");
      loadMarcas();
    } catch (error) {
      // Se erro 400 e código FK_PRODUTO_MARCA, mostrar modal de exclusão forçada
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data?.code === "FK_PRODUTO_MARCA"
      ) {
        setShowDeleteModal(false);
        setMarcaForceDelete(marcaToDelete);
        setShowForceDeleteModal(true);
        return;
      }
      toastError(`Erro ao excluir marca: ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setMarcaToDelete(null);
    }
  };

  const handleForceDeleteConfirm = async () => {
    try {
      if (!marcaForceDelete) return;
      await deleteMarca(marcaForceDelete, true);
      toastSuccess("Marca excluída e produtos atualizados para marca padrão!");
      loadMarcas();
    } catch (error) {
      toastError(`Erro ao excluir marca (forçado): ${error.message}`);
    } finally {
      setShowForceDeleteModal(false);
      setMarcaForceDelete(null);
    }
  };

  // Chama loadMarcas sempre que page, limit ou searchQuery mudarem
  useEffect(() => {
    loadMarcas();
  }, [page, limit, searchQuery]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        {mode === MODES.LIST ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Marcas de Produtos
              </h1>
              <button
                onClick={() => setMode(MODES.CREATE)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Criar nova marca"
              >
                Nova Marca
              </button>
            </div>

            {/* Campo de busca adicionado aqui */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Campo de busca por nome da marca"
              />
            </div>

            <MarcasTable
              marcas={marcas}
              onEdit={(marca) => {
                setSelectedMarca(marca);
                setMode(MODES.EDIT);
              }}
              onDelete={(codigo) => {
                setMarcaToDelete(codigo);
                setShowDeleteModal(true);
              }}
            />

            {/* Controles de paginação */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-600">
                Página {page} de {totalPages} ({total} marcas)
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
          <MarcaForm
            marca={mode === MODES.EDIT ? selectedMarca : null}
            onSave={handleSave}
            onCancel={() => setMode(MODES.LIST)}
            isSubmitting={isSubmitting}
            isEditing={false}
          />
        )}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta marca?"
          confirmText="Excluir"
          cancelText="Cancelar"
        />
        <ConfirmationModal
          isOpen={showForceDeleteModal}
          onClose={() => setShowForceDeleteModal(false)}
          onConfirm={handleForceDeleteConfirm}
          title="Excluir Marca com Produtos Vinculados"
          message="Existem produtos vinculados a esta marca. Deseja excluir mesmo assim? Todos os produtos dessa marca serão movidos para a marca padrão (código 1)."
          confirmText="Excluir Forçado"
          cancelText="Cancelar"
        />
      </div>
    </>
  );
};

export default MarcaProdutoPage;
