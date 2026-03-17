import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  movimentarEstoquePorCodigo,
  movimentarEstoquePorBarcode,
  getProdutoPorBarcode,
} from "../services/api";

let audioCtx;
const playErrorBeep = (enabled = true) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const duration = 0.15;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 880;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration,
    );
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Silencia erros de áudio para não atrapalhar o fluxo
  }
};

const LancamentoEstoque = () => {
  const navigate = window.history && window.history.back ? null : null;
  // Estado inicial para lançamentos e busca
  const [isLancarLoading, setIsLancarLoading] = useState(false);
  const [lancarErro, setLancarErro] = useState(null);
  const [lancarSucesso, setLancarSucesso] = useState("");
  // Importa funções corretas do serviço
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [autoLancarPorLeitura, setAutoLancarPorLeitura] = useState(false);
  const [beepErroAtivo, setBeepErroAtivo] = useState(true);
  const [tempoLimpezaErroMs, setTempoLimpezaErroMs] = useState(1000);

  // Carrega configurações salvas (Configurações de Lançamento)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lancamentoEstoqueConfig");
      if (saved) {
        const cfg = JSON.parse(saved);
        if (typeof cfg.autoLancarPorLeitura === "boolean") {
          setAutoLancarPorLeitura(cfg.autoLancarPorLeitura);
        }
        if (typeof cfg.beepErro === "boolean") {
          setBeepErroAtivo(cfg.beepErro);
        }
        if (typeof cfg.tempoLimpezaErroMs === "number") {
          setTempoLimpezaErroMs(cfg.tempoLimpezaErroMs);
        }
      }
    } catch (e) {
      // ignora erros de leitura de config
    }
  }, []);
  // Busca inteligente: só busca após 4 caracteres
  React.useEffect(() => {
    if (busca.length < 4) {
      setSugestoes([]);
      return;
    }
    setBuscando(true);
    import("../services/api").then(({ buscarProdutos }) => {
      buscarProdutos(busca)
        .then((data) => setSugestoes(data))
        .catch(() => setSugestoes([]))
        .finally(() => setBuscando(false));
    });
  }, [busca]);
  const [quantidade, setQuantidade] = useState("");
  const [tipoMovimentacao, setTipoMovimentacao] = useState("");
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [primeiroLancamento, setPrimeiroLancamento] = useState(true);

  const getCodigoProduto = (produto) => {
    const bruto =
      produto?.CODIGO ?? produto?.codigo_interno ?? produto?.CODIGO_INTERNO;
    const codigo = Number(bruto);
    if (!Number.isInteger(codigo) || codigo <= 0) return null;
    return codigo;
  };

  const getCodigoBarras = (produto) => {
    return String(produto?.CODIGO_BARRAS ?? produto?.codigo_barras ?? "").trim();
  };

  const normalizarProduto = (produto) => {
    const codigoProduto = getCodigoProduto(produto);
    const codigoBarras = getCodigoBarras(produto);
    return {
      ...produto,
      codigo_interno: codigoProduto ?? "",
      CODIGO_BARRAS: codigoBarras,
      estoque_atual: produto?.estoque_atual ?? produto?.ESTOQUE_ATUAL ?? undefined,
    };
  };

  const handleBuscaKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const term = busca.trim();
    if (!term) return;
    const onlyDigits = term.replace(/\D/g, "");
    const isPossibleEan = onlyDigits.length === 12 || onlyDigits.length === 13;

    if (!isPossibleEan) return; // deixa a busca textual normal agir (useEffect)

    try {
      setBuscando(true);
      const produto = await getProdutoPorBarcode(onlyDigits);
      if (produto) {
        const normalizado = normalizarProduto(produto);
        // Modo "caixa": lança automaticamente com a última configuração
        if (autoLancarPorLeitura) {
          const ultimoTipo =
            movimentacoes[movimentacoes.length - 1]?.tipo ||
            tipoMovimentacao ||
            "entrada";
          const estoqueAntes =
            normalizado.ESTOQUE_ATUAL ?? normalizado.estoque_atual ?? "-";
          setMovimentacoes([
            ...movimentacoes,
            {
              produto: normalizado,
              quantidade: 1,
              tipo: ultimoTipo,
              estoqueAntes,
            },
          ]);
          setBusca("");
          setSugestoes([]);
          setLancarErro(null);
          setPrimeiroLancamento(false);
        } else {
          // Fluxo atual: apenas seleciona o produto e deixa o usuário definir quantidade/tipo
          setProdutoSelecionado(normalizado);
          setSugestoes([]);
          setLancarErro(null);
        }
      } else {
        setLancarErro(
          "Produto não encontrado para o código de barras informado.",
        );
        playErrorBeep(beepErroAtivo);
        setTimeout(() => {
          setBusca("");
          setLancarErro(null);
        }, tempoLimpezaErroMs);
      }
    } catch (err) {
      console.error("Erro ao buscar produto por barcode:", err);
      setLancarErro("Erro ao buscar produto por código de barras.");
      playErrorBeep(beepErroAtivo);
      setTimeout(() => {
        setBusca("");
        setLancarErro(null);
      }, tempoLimpezaErroMs);
    } finally {
      setBuscando(false);
    }
  };

  // Estrutura visual inicial
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <Header title="Lançamento de Estoque" />
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl">
        {/* Campo de busca inteligente */}
        <input
          type="text"
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Digite código de barras, EAN, descrição ou código interno"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={handleBuscaKeyDown}
        />
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            id="auto-lancar"
            type="checkbox"
            className="h-4 w-4"
            checked={autoLancarPorLeitura}
            onChange={(e) => setAutoLancarPorLeitura(e.target.checked)}
          />
          <label htmlFor="auto-lancar">
            Lançar automaticamente ao ler código de barras (quantidade = 1),
            usando o mesmo tipo da última movimentação.
          </label>
        </div>
        {lancarErro && (
          <div className="mb-2 text-sm text-red-600">{lancarErro}</div>
        )}
        {buscando && (
          <div className="mb-2 text-sm text-gray-500">Buscando...</div>
        )}
        {sugestoes.length > 0 && (
          <ul className="border rounded mb-4 bg-white">
            {sugestoes.map((produto) => (
              <li
                key={produto.CODIGO || produto.codigo_interno}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                  produtoSelecionado &&
                  produtoSelecionado.CODIGO === produto.CODIGO
                    ? "bg-blue-200"
                    : ""
                }`}
                onClick={() => setProdutoSelecionado(normalizarProduto(produto))}
              >
                {getCodigoProduto(produto) ?? "-"} - {produto.DESCRICAO}
              </li>
            ))}
          </ul>
        )}
        {produtoSelecionado && (
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <strong>Produto selecionado:</strong>
            <br />
            {produtoSelecionado.codigo_interno} - {produtoSelecionado.DESCRICAO}
            <div className="mt-4">
              <label className="block font-medium mb-1">Quantidade</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2 mb-2"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Digite a quantidade"
              />
            </div>
            {primeiroLancamento && (
              <div className="mt-2">
                <label className="block font-medium mb-1">
                  Tipo de Movimentação
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={tipoMovimentacao}
                  onChange={(e) => setTipoMovimentacao(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="inventario">Inventário</option>
                </select>
              </div>
            )}
            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                if (
                  !quantidade ||
                  !produtoSelecionado ||
                  (primeiroLancamento && !tipoMovimentacao)
                )
                  return;
                setMovimentacoes([
                  ...movimentacoes,
                  {
                    produto: normalizarProduto(produtoSelecionado),
                    quantidade,
                    tipo:
                      tipoMovimentacao || movimentacoes[0]?.tipo || "entrada",
                    estoqueAntes:
                      produtoSelecionado.ESTOQUE_ATUAL ??
                      produtoSelecionado.estoque_atual ??
                      "-",
                  },
                ]);
                setQuantidade("");
                setProdutoSelecionado(null);
                setBusca("");
                if (primeiroLancamento) setPrimeiroLancamento(false);
              }}
              disabled={
                !quantidade ||
                !produtoSelecionado ||
                (primeiroLancamento && !tipoMovimentacao)
              }
            >
              Adicionar ao grid
            </button>
          </div>
        )}
        {/* Quantidade e tipo de movimentação - será implementado */}
        {/* Grid de movimentações pendentes - será implementado */}
        {movimentacoes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">
              Movimentações pendentes
            </h2>
            <div className="w-full max-w-5xl mx-auto overflow-x-auto mb-4">
              <table className="min-w-full border rounded bg-white shadow-md">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left min-w-[320px] w-1/2">
                      Produto
                    </th>
                    <th className="px-4 py-2 text-left">Estoque Antes</th>
                    <th className="px-4 py-2 text-left">Quantidade</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((mov, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2 min-w-[320px] w-1/2 whitespace-nowrap overflow-hidden text-ellipsis">
                        {getCodigoProduto(mov.produto) ?? "-"} - {mov.produto.DESCRICAO}
                      </td>
                      <td className="px-4 py-2">{mov.estoqueAntes}</td>
                      <td className="px-4 py-2">{mov.quantidade}</td>
                      <td className="px-4 py-2">{mov.tipo}</td>
                      <td className="px-4 py-2 flex gap-2 justify-center items-center">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                          onClick={() => {
                            setProdutoSelecionado(mov.produto);
                            setQuantidade(mov.quantidade);
                            if (idx === 0) {
                              setTipoMovimentacao(mov.tipo);
                              setPrimeiroLancamento(true);
                            }
                            setMovimentacoes(
                              movimentacoes.filter((_, i) => i !== idx),
                            );
                          }}
                        >
                          <FaEdit size={20} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                          onClick={() =>
                            setMovimentacoes(
                              movimentacoes.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <FaTrash size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Botão de lançar estoque - será implementado */}
        {movimentacoes.length > 0 && (
          <div className="flex flex-col items-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition disabled:opacity-60 w-full max-w-xs"
              disabled={isLancarLoading}
              onClick={async () => {
                setIsLancarLoading(true);
                setLancarErro(null);
                setLancarSucesso("");
                let erros = [];
                // Mapeia tipo para o formato do backend
                const mapTipo = (tipo) => {
                  if (tipo === "entrada") return "E";
                  if (tipo === "saida") return "S";
                  if (tipo === "inventario") return "I";
                  return (tipo || "").toUpperCase().charAt(0);
                };
                for (const mov of movimentacoes) {
                  try {
                    const tipoBackend = mapTipo(mov.tipo);
                    const codigoProduto = getCodigoProduto(mov.produto);
                    const codigoBarras = getCodigoBarras(mov.produto);
                    if (codigoProduto) {
                      await movimentarEstoquePorCodigo({
                        codigoProduto,
                        tipo: tipoBackend,
                        quantidade: Number(mov.quantidade),
                        usuario: (
                          localStorage.getItem("usuario") || "admin"
                        ).substring(0, 8),
                      });
                    } else if (codigoBarras) {
                      await movimentarEstoquePorBarcode({
                        codigo_barras: codigoBarras,
                        tipo: tipoBackend,
                        quantidade: Number(mov.quantidade),
                        usuario: (
                          localStorage.getItem("usuario") || "admin"
                        ).substring(0, 8),
                      });
                    } else {
                      erros.push("Produto sem identificador válido");
                    }
                  } catch (err) {
                    erros.push(err.message || "Erro desconhecido");
                  }
                }
                if (erros.length === 0) {
                  setMovimentacoes([]);
                  setProdutoSelecionado(null);
                  setQuantidade("");
                  setTipoMovimentacao("");
                  setPrimeiroLancamento(true);
                  setLancarSucesso("Movimentações lançadas com sucesso!");
                } else {
                  setLancarErro(
                    "Algumas movimentações falharam: " + erros.join(", "),
                  );
                }
                setIsLancarLoading(false);
              }}
            >
              {isLancarLoading ? "Lançando..." : "Lançar estoque"}
            </button>
            {lancarErro && (
              <div className="mt-2 text-red-600">{lancarErro}</div>
            )}
            {lancarSucesso && (
              <div className="mt-2 text-green-600">{lancarSucesso}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LancamentoEstoque;
