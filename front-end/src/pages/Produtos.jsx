import React, { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import {
  deleteProduto,
  getProdutos,
  getFornecedor,
  getMarcas,
} from "../services/api";
import { toastSuccess, toastError } from "../services/toast";
import ProdutosTable from "../components/ProdutosTable";
import { buildApiUrl } from "../config/apiBaseUrl";

const Produtos = () => {
  const getOptionId = (option) =>
    option?.CODIGO || option?.id || option?.codigo || "sem-id";
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showSimpleDeleteModal, setShowSimpleDeleteModal] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState([]);
  // Novos estados para paginação/filtros/ordenação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [fornecedor, setFornecedor] = useState("");
  const [marca, setMarca] = useState("");
  const [marcas, setMarcas] = useState([]);
  const [marcasLoading, setMarcasLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresLoading, setFornecedoresLoading] = useState(false);
  const [fornecedorInput, setFornecedorInput] = useState("");
  const [orderBy, setOrderBy] = useState("CODIGO");
  const [orderDir, setOrderDir] = useState("asc");

  // Buscar fornecedores dinamicamente conforme digita
  useEffect(() => {
    let ignore = false;
    const fetchFornecedores = async () => {
      setFornecedoresLoading(true);
      try {
        const forn = await getFornecedor({
          search: fornecedorInput,
          limit: 500,
          orderBy: "NOME",
          orderDir: "asc",
        });
        if (!ignore)
          setFornecedores(Array.isArray(forn?.data) ? forn.data : []);
      } catch {
        if (!ignore) setFornecedores([]);
      }
      setFornecedoresLoading(false);
    };
    fetchFornecedores();
    return () => {
      ignore = true;
    };
  }, [fornecedorInput]);

  // Carregar todas as marcas ao montar
  useEffect(() => {
    const fetchMarcas = async () => {
      setMarcasLoading(true);
      try {
        const marc = await getMarcas({
          page: 1,
          limit: 1000, // busca "todas" as marcas, ajuste conforme necessário
          search: "",
          orderBy: "DESCRICAO",
          orderDir: "asc",
        });
        setMarcas(
          Array.isArray(marc?.data) ? marc.data : marc?.data?.data || [],
        );
      } catch {
        setMarcas([]);
      }
      setMarcasLoading(false);
    };
    fetchMarcas();
  }, []);

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      try {
        const data = await getProdutos({
          page,
          limit,
          search: searchTerm || undefined,
          fornecedor: fornecedor || undefined,
          marca: marca || undefined,
          orderBy,
          orderDir,
        });
        setProdutos(data.data);
        setTotalPages(data.totalPages);
        // Se a API retornar total, pode salvar para exibir
        if (data.total) setTotal(data.total);
      } catch {
        toastError("Erro ao buscar produtos");
      }
      setLoading(false);
    };
    fetchProdutos();
  }, [page, limit, fornecedor, marca, orderBy, orderDir, searchTerm]);

  // Estado para total de registros (opcional, se a API retornar)
  const [total, setTotal] = useState(0);

  // Função para verificar registros relacionados
  const handleDelete = (productId) => {
    setProductToDelete(productId);
    setShowSimpleDeleteModal(true);
  };

  const confirmSimpleDelete = async () => {
    try {
      const response = await deleteProduto(productToDelete);
      if (response.relatedRecords) {
        setRelatedRecords(response.relatedRecords);
        setShowDeleteModal(true);
      } else {
        setProdutos(produtos.filter((p) => p.CODIGO !== productToDelete));
        toastSuccess("Produto excluído com sucesso!");
      }
    } catch (error) {
      toastError("Erro ao excluir produto: " + error.message);
    } finally {
      setShowSimpleDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Função para excluir tudo (produto e registros relacionados)
  const confirmDelete = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`/produto/${productToDelete}/excluir-tudo`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        // Remove o produto da lista local
        setProdutos(produtos.filter((p) => p.CODIGO !== productToDelete));
        toastSuccess("Produto e registros relacionados excluídos com sucesso!");
      } else {
        throw new Error("Erro ao excluir produto e registros relacionados.");
      }
    } catch (error) {
      toastError(
        "Erro ao excluir produto e registros relacionados.",
        error.message,
      );
    } finally {
      setShowDeleteModal(false); // Fecha o modal
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div className="flex items-center gap-2">
            <Link
              to="/produto/novo"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Novo produto"
            >
              <FaPlus size={14} />
            </Link>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, código ou barras..."
            className="px-2 py-2 border rounded w-72 md:w-96 flex-1 min-w-[180px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="min-w-[220px]">
            <Autocomplete
              options={fornecedores}
              loading={fornecedoresLoading}
              getOptionLabel={(option) => option.NOME || option.nome || ""}
              renderOption={(props, option, state) => (
                <li
                  {...props}
                  key={`fornecedor-${getOptionId(option)}-${state.index}`}
                >
                  {option.NOME || option.nome || ""}
                </li>
              )}
              isOptionEqualToValue={(option, value) =>
                (option.CODIGO || option.id || option.codigo) ===
                (value.CODIGO || value.id || value.codigo)
              }
              value={
                fornecedores.find(
                  (f) => (f.CODIGO || f.id || f.codigo) === fornecedor,
                ) || null
              }
              onChange={(_, newValue) => {
                setFornecedor(
                  newValue
                    ? newValue.CODIGO || newValue.id || newValue.codigo
                    : "",
                );
              }}
              inputValue={fornecedorInput}
              onInputChange={(_, newInputValue) =>
                setFornecedorInput(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fornecedor"
                  placeholder="Buscar fornecedor..."
                  size="small"
                />
              )}
              clearOnEscape
              noOptionsText="Nenhum fornecedor encontrado"
            />
          </div>
          <div className="min-w-[220px]">
            <Autocomplete
              options={marcas}
              loading={marcasLoading}
              getOptionLabel={(option) => option.DESCRICAO || option.nome || ""}
              renderOption={(props, option, state) => (
                <li
                  {...props}
                  key={`marca-${getOptionId(option)}-${state.index}`}
                >
                  {option.DESCRICAO || option.nome || ""}
                </li>
              )}
              isOptionEqualToValue={(option, value) =>
                (option.CODIGO || option.id || option.codigo) ===
                (value.CODIGO || value.id || value.codigo)
              }
              value={
                marcas.find((m) => (m.CODIGO || m.id || m.codigo) === marca) ||
                null
              }
              onChange={(_, newValue) => {
                setMarca(
                  newValue
                    ? newValue.CODIGO || newValue.id || newValue.codigo
                    : "",
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Marca"
                  placeholder="Buscar marca..."
                  size="small"
                />
              )}
              clearOnEscape
              noOptionsText="Nenhuma marca encontrada"
            />
          </div>
          {/* Ordenação agora apenas pelos ícones no cabeçalho da tabela */}
          <div className="ml-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFornecedor("");
                setFornecedorInput("");
                setMarca("");
                setOrderBy("CODIGO");
                setOrderDir("asc");
                setPage(1);
              }}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700"
              style={{ height: 40 }}
            >
              Limpar
            </button>
          </div>
        </div>
        <ProdutosTable
          produtos={Array.isArray(produtos) ? produtos : []}
          onEdit={(codigo) =>
            (window.location.href = `/produto/editar/${codigo}`)
          }
          onDelete={handleDelete}
          onView={(codigo) => (window.location.href = `/produto/${codigo}`)}
          loading={loading}
          orderBy={orderBy}
          orderDir={orderDir}
          setOrderBy={setOrderBy}
          setOrderDir={setOrderDir}
        />
        {/* ProdutosGrid mantido para backup:
        <ProdutosGrid
          produtos={Array.isArray(produtos) ? produtos : []}
          onEdit={(codigo) =>
            (window.location.href = `/produto/editar/${codigo}`)
          }
          onDelete={handleDelete}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        */}
        {/* Modal de confirmação simples para qualquer exclusão */}
        {showSimpleDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir este produto?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowSimpleDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSimpleDelete}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Controles de paginação no padrão da página de marcas */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-600">
            Página {page} de {totalPages} {total ? `(${total} produtos)` : ""}
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
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Modal de Confirmação */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Confirmação de Exclusão
            </h2>
            <p className="text-gray-700 mb-4">
              Os seguintes registros relacionados serão excluídos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {relatedRecords.map((record, index) => {
                // Tenta usar um campo único como key, senão usa index
                const uniqueKey =
                  record.CODIGO || record.id || record.codigo || index;
                return (
                  <div
                    key={uniqueKey}
                    className="bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col justify-between"
                  >
                    <h3 className="text-sm font-semibold text-gray-800">
                      Registro #{index + 1}
                    </h3>
                    <ul className="text-xs text-gray-600 mt-2">
                      {Object.entries(record).map(([key, value]) => {
                        const isDate =
                          typeof value === "string" &&
                          !isNaN(new Date(value).getTime()) &&
                          value.trim() !== "";
                        const formattedValue =
                          value === null || value === ""
                            ? "N/A"
                            : isDate
                              ? new Date(value).toLocaleDateString("pt-BR")
                              : value;
                        // Usa key composta para evitar duplicidade
                        return (
                          <li key={key + "-" + uniqueKey}>
                            <span className="font-medium">{key}:</span>{" "}
                            {formattedValue}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;
