import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import {
  getProdutoById,
  getMarca,
  getFamilia,
  deleteProduto,
  getHistoricoEstoque,
} from "../services/api";
import { toastSuccess, toastError } from "../services/toast";
import { buildApiUrl } from "../config/apiBaseUrl";

const ProdutoDetalhes = () => {
  const [historico, setHistorico] = useState([]);
  const [mostrarMais, setMostrarMais] = useState(false);
  const { id } = useParams();
  const [produto, setProduto] = useState(null);
  const [marca, setMarca] = useState("");
  const [familia, setFamilia] = useState("");
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSimpleDeleteModal, setShowSimpleDeleteModal] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState([]); // Registros relacionados

  // Função para verificar registros relacionados
  const handleDelete = () => {
    setShowSimpleDeleteModal(true);
  };

  const confirmSimpleDelete = async () => {
    try {
      const response = await deleteProduto(id);
      if (response.relatedRecords) {
        setRelatedRecords(response.relatedRecords);
        setShowDeleteModal(true);
      } else {
        navigate("/produtos");
        toastSuccess("Produto excluído com sucesso!");
      }
    } catch (error) {
      toastError("Erro ao excluir produto.", error.message);
    } finally {
      setShowSimpleDeleteModal(false);
    }
  };

  // Função para excluir tudo (produto e registros relacionados)
  const confirmDelete = async () => {
    try {
      const response = await fetch(buildApiUrl(`/produto/${id}/excluir-tudo`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        navigate("/produtos");
        toastSuccess("Produto e registros relacionados excluídos com sucesso!");
      } else {
        throw new Error("Erro ao excluir produto e registros relacionados.");
      }
    } catch (error) {
      toastError(
        "Erro ao excluir produto e registros relacionados.",
        error.message
      );
    } finally {
      setShowDeleteModal(false); // Fecha o modal
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const produtoData = await getProdutoById(id);
      setProduto(produtoData);
      // Buscar histórico de movimentações
      if (produtoData.CODIGO_BARRAS) {
        try {
          const historicoData = await getHistoricoEstoque(
            produtoData.CODIGO_BARRAS
          );
          setHistorico(historicoData);
        } catch (err) {
          setHistorico([]);
        }
      }

      if (produtoData.CODIGO_MARCA) {
        const marcaData = await getMarca(produtoData.CODIGO_MARCA);
        setMarca(
          marcaData && marcaData.DESCRICAO ? marcaData.DESCRICAO : "N/A"
        );
      } else {
        setMarca("N/A");
      }

      if (produtoData.CODIGO_FAMILIA) {
        const familiaData = await getFamilia(produtoData.CODIGO_FAMILIA);
        setFamilia(
          familiaData && familiaData.DESCRICAO ? familiaData.DESCRICAO : "N/A"
        );
      } else {
        setFamilia("N/A");
      }
    };
    fetchData();
  }, [id]);

  if (!produto) return <div className="text-center mt-8">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {produto.DESCRICAO}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-gray-600 font-semibold">
                Código Interno:
              </label>
              <p className="text-gray-800">{produto.CODIGO_INTERNO}</p>
            </div>

            <div>
              <label className="text-gray-600 font-semibold">
                Código de Barras:
              </label>
              <p className="text-gray-800">{produto.CODIGO_BARRAS}</p>
            </div>

            <div>
              <label className="text-gray-600 font-semibold">Marca:</label>
              <p className="text-gray-800">{marca || "N/A"}</p>
            </div>

            <div>
              <label className="text-gray-600 font-semibold">Família:</label>
              <p className="text-gray-800">{familia || "N/A"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600 font-semibold">
                  Estoque Atual:
                </label>
                <p className="text-2xl text-blue-600">
                  {produto.ESTOQUE_ATUAL}
                </p>
              </div>
              <div>
                <label className="text-gray-600 font-semibold">
                  Estoque Mínimo:
                </label>
                <p className="text-2xl text-red-600">
                  {produto.ESTOQUE_MINIMO}
                </p>
              </div>
            </div>

            {/* Grid de últimas movimentações */}
            {historico.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Movimentações de Estoque
                </h2>
                <table className="w-full border rounded bg-gray-50">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Data</th>
                      <th className="px-2 py-1 text-left">Tipo</th>
                      <th className="px-2 py-1 text-left">Quantidade</th>
                      <th className="px-2 py-1 text-left">Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mostrarMais
                      ? historico.slice(0, 20)
                      : historico.slice(0, 5)
                    ).map((mov, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-2 py-1">
                          {new Date(mov.DATA).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-2 py-1">{mov.TIPO_LANCAMENTO}</td>
                        <td className="px-2 py-1">{mov.QUANTIDADE}</td>
                        <td className="px-2 py-1">{mov.USUARIO}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {historico.length > 5 && !mostrarMais && (
                  <button
                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    onClick={() => setMostrarMais(true)}
                  >
                    Ver mais movimentações
                  </button>
                )}
                {mostrarMais && historico.length > 5 && (
                  <button
                    className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    onClick={() => setMostrarMais(false)}
                  >
                    Ver menos
                  </button>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="mt-8 flex space-x-4">
              <Link
                to={`/produto/editar/${produto.CODIGO}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Editar
              </Link>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
              <Link
                to="/produtos"
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Voltar
              </Link>
            </div>
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
                      onClick={() => setShowSimpleDeleteModal(false)}
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

            {/* Grade de Registros Relacionados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {relatedRecords.map((record, index) => {
                // Formatação dos campos
                const formattedRecord = Object.entries(record).map(
                  ([key, value]) => {
                    const isDate =
                      typeof value === "string" &&
                      !isNaN(new Date(value).getTime()) &&
                      value.trim() !== "";
                    const formattedValue = isDate
                      ? new Date(value).toLocaleDateString("pt-BR")
                      : value;

                    return (
                      <li key={key}>
                        <span className="font-medium">{key}:</span>{" "}
                        {formattedValue}
                      </li>
                    );
                  }
                );

                return (
                  <div
                    key={index}
                    className="bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col justify-between"
                  >
                    <h3 className="text-sm font-semibold text-gray-800">
                      Registro #{index + 1}
                    </h3>
                    <ul className="text-xs text-gray-600 mt-2">
                      {formattedRecord}
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

export default ProdutoDetalhes;
