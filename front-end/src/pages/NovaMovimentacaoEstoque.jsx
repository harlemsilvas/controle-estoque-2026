import React, { useState, useEffect, useCallback } from "react";
import { toastSuccess, toastError } from "../services/toast";
import Header from "../components/Header";
import { buscarProdutos, registrarMovimentacao } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const NovaMovimentacaoEstoque = () => {
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [buscarNovamente, setBuscarNovamente] = useState(false); // <-- Novo estado
  // const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const logado = user?.nome || "admin"; // Substituir por usuário logado
  const [form, setForm] = useState({
    tipo: "E",
    quantidade: "",
    usuario: logado, //"ADMIN", // Substituir por usuário logado
  });

  const buscarProdutosAtualizados = useCallback(async () => {
    try {
      const data = await buscarProdutos(termoBusca);
      setResultados(data);
    } catch (error) {
      toastError(error.message || "Erro ao atualizar lista");
    } finally {
      // setLoading(false);
      setBuscarNovamente(false);
    }
  }, [termoBusca]); // Dependências da função

  // MODIFICAÇÃO PARA NÃO VALIDAR O TERMO BUSCA
  // const handleBusca = useCallback(async () => {
  //   try {
  //     const termoTratado = termoBusca.trim().replace(/\s+/g, " ");
  //     const termoCodificado = encodeURIComponent(termoTratado);

  //     if (!termoTratado) {
  //       toastError("Digite um critério de busca");
  //       return;
  //     }

  //     setLoading(true);
  //     const data = await buscarProdutos(termoCodificado);
  //     setResultados(data);
  //   } catch (error) {
  //     toastError(error.message || "Erro na busca de produtos");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [termoBusca]); // Dependências: termoBusca
  // MODIFICAÇÃO PARA NÃO VALIDAR O TERMO BUSCA
  const handleBusca = useCallback(
    async (isInitialLoad = false) => {
      try {
        const termoTratado = termoBusca.trim().replace(/\s+/g, " ");
        const termoCodificado = encodeURIComponent(termoTratado);

        // Não exibir erro se for carregamento inicial
        if (!isInitialLoad && !termoTratado) {
          toastError("Digite um critério de busca");
          return;
        }

        // setLoading(true);
        const data = await buscarProdutos(termoCodificado);
        setResultados(data);
      } catch (error) {
        toastError(error.message || "Erro na busca de produtos");
      } finally {
        // setLoading(false);
      }
    },
    [termoBusca]
  );

  // const handleBusca = async () => {
  //   try {
  //     const data = await buscarProdutos(termoBusca);
  //     setResultados(data);
  //   } catch (error) {
  //     toastError(error.message || "Erro na busca de produtos");
  //   }
  // };
  // components/NovaMovimentacaoEstoque.js

  // Retirado, para melhorar a função, e não entrar em loop
  // useEffect(() => {
  //   if (buscarNovamente) {
  //     const buscarProdutosAtualizados = async () => {
  //       try {
  //         const data = await buscarProdutos(termoBusca);
  //         setResultados(data);
  //       } catch (error) {
  //         toastError(error.message || "Erro ao atualizar lista");
  //       } finally {
  //         setBuscarNovamente(false); // Reseta o estado após a busca
  //       }
  //     };

  //     buscarProdutosAtualizados();
  //   }
  // }, [buscarNovamente, termoBusca]); // <-- Executa quando buscarNovamente muda

  // Busca inicial ao montar o componente - EXCLUIDO POIS DA ERRO QUANDO MONTA O COMPONENTE
  // useEffect(() => {
  //   handleBusca();
  // }, [handleBusca]); // <- Agora handleBusca é uma dependência estável

  useEffect(() => {
    if (buscarNovamente) {
      buscarProdutosAtualizados();
    }
  }, [buscarNovamente, buscarProdutosAtualizados]); // <-- Agora a função é estável

  // // Efeito para atualização após movimentação
  // useEffect(() => {
  //   const buscarAposMovimentacao = async () => {
  //     try {
  //       const data = await buscarProdutos(termoBusca);
  //       setResultados(data);
  //     } catch (error) {
  //       toastError(error.message || "Erro ao atualizar lista");
  //     } finally {
  //       setLoading(false);
  //       setBuscarNovamente(false);
  //     }
  //   };

  //   if (buscarNovamente) {
  //     buscarAposMovimentacao();
  //   }
  // }, [buscarNovamente, termoBusca]); // Dependências explícitas

  // Efeito para atualizar a lista após movimentação
  useEffect(() => {
    const buscarAposMovimentacao = async () => {
      try {
        await handleBusca(); // Usa a função memoizada
        setBuscarNovamente(false);
      } catch (error) {
        toastError(error.message);
      }
    };

    if (buscarNovamente) {
      buscarAposMovimentacao();
    }
  }, [buscarNovamente, handleBusca]); // Dependências explícitas

  // const handleBusca = async () => {
  //   try {
  //     const termoTratado = termoBusca.trim().replace(/\s+/g, " "); // Remove espaços extras
  //     const termoCodificado = encodeURIComponent(termoTratado); // Codifica caracteres especiais

  //     if (!termoTratado) {
  //       toastError("Digite um critério de busca");
  //       return;
  //     }

  //     const data = await buscarProdutos(termoCodificado);
  //     setResultados(data);
  //   } catch (error) {
  //     toastError(error.message);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registrarMovimentacao({
        codigoProduto: produtoSelecionado.CODIGO,
        tipo: form.tipo,
        quantidade: Number(form.quantidade), // <-- Converta para número
        usuario: form.usuario,
        // ...form,
      });

      toastSuccess(`
        Movimentação registrada!
        Estoque anterior: ${response.estoqueAnterior}
        Novo estoque: ${response.novoEstoque}
      `);

      // Log no console
      console.log("Detalhes da movimentação:", {
        produto: produtoSelecionado,
        movimento: form,
        estoqueAnterior: response.estoqueAnterior,
        novoEstoque: response.novoEstoque,
      });

      // Após sucesso:
      // setBuscarNovamente(true); // <-- Força nova busca

      // Força atualização imediata
      setBuscarNovamente(true);
      // Reset form
      setForm({ tipo: "E", quantidade: "", usuario: logado });
      setProdutoSelecionado(null);
      //setTermoBusca("");
    } catch (error) {
      toastError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Nova Movimentação de Estoque" />

      <div className="container mx-auto px-6 py-8">
        {/* Busca de Produtos */}
        <center>
          <h2>"Controle de Estoque por Código de Barras, Nome ou Código"</h2>
        </center>
        <h3>NovaMovimentacaoEstoque.jsx</h3>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Digite EAN, código ou descrição"
              className="flex-1 p-2 border rounded"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <button
              type="button"
              onClick={handleBusca}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>

          {/* Resultados da Busca */}
          {resultados.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded">
              {resultados.map((produto) => (
                <div
                  key={produto.CODIGO}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => setProdutoSelecionado(produto)}
                >
                  <div className="font-semibold">{produto.DESCRICAO}</div>
                  <div className="text-sm text-gray-600">
                    EAN: {produto.EAN} | Código: {produto.CODIGO} | Estoque:{" "}
                    {produto.ESTOQUE_ATUAL}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de Movimentação */}
        {produtoSelecionado && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Produto Selecionado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Descrição:</p>
                <p>{produtoSelecionado.DESCRICAO}</p>
              </div>
              <div>
                <p className="font-semibold">Estoque Atual:</p>
                <p>{produtoSelecionado.ESTOQUE_ATUAL}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block font-medium mb-2">
                  Tipo de Movimentação
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="E">Entrada</option>
                  <option value="S">Saída</option>
                  <option value="I">Inventário</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Quantidade</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full p-2 border rounded"
                  value={form.quantidade}
                  onChange={
                    (e) => {
                      // Forçar entrada numérica
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setForm({ ...form, quantidade: value });
                    }
                    //  setForm({ ...form, quantidade: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Registrar Movimentação
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovaMovimentacaoEstoque;
