import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  getProdutosLixeira,
  restaurarProduto,
  excluirPermanentemente,
} from "../services/api";
import { toastSuccess, toastError } from "../services/toast";

const LixeiraProdutos = () => {
  const [produtos, setProdutos] = useState([]);
  const [acao, setAcao] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    const carregarLixeira = async () => {
      try {
        const data = await getProdutosLixeira();
        setProdutos(data);
      } catch (error) {
        toastError("Erro ao carregar lixeira");
      }
    };
    carregarLixeira();
  }, []);

  const handleConfirmarAcao = async () => {
    try {
      if (acao === "restaurar") {
        await restaurarProduto(produtoSelecionado);
        setProdutos(produtos.filter((p) => p.CODIGO !== produtoSelecionado));
        toastSuccess("Produto restaurado!");
      } else {
        await excluirPermanentemente(produtoSelecionado);
        setProdutos(produtos.filter((p) => p.CODIGO !== produtoSelecionado));
        toastSuccess("Excluído permanentemente!");
      }
      setAcao(null);
      setProdutoSelecionado(null);
    } catch (error) {
      toastError(error.response?.data || "Erro na operação");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Lixeira Virtual" />

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Excluído em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {produtos.map((produto) => (
                <tr key={produto.CODIGO} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{produto.CODIGO}</td>
                  <td className="px-6 py-4">{produto.DESCRICAO}</td>
                  <td className="px-6 py-4">
                    {new Date(produto.DELETADO_EM).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setAcao("restaurar");
                        setProdutoSelecionado(produto.CODIGO);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      Restaurar
                    </button>
                    <button
                      onClick={() => {
                        setAcao("excluir");
                        setProdutoSelecionado(produto.CODIGO);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {produtos.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Nenhum produto na lixeira
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!acao}
        onClose={() => setAcao(null)}
        onConfirm={handleConfirmarAcao}
        title={
          acao === "restaurar" ? "Restaurar Produto" : "Exclusão Definitiva"
        }
        message={
          acao === "restaurar"
            ? "Deseja restaurar este produto?"
            : "Tem certeza que deseja excluir permanentemente?"
        }
        confirmText={acao === "restaurar" ? "Restaurar" : "Excluir"}
        confirmColor={acao === "restaurar" ? "bg-green-600" : "bg-red-600"}
      />
    </div>
  );
};

export default LixeiraProdutos;
