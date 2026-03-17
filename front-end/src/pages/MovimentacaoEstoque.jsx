import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { buscarProdutos, getProdutoById } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toastSuccess, toastError } from "../services/toast";
import Header from "../components/Header";
import {
  movimentarEstoquePorCodigo,
  movimentarEstoquePorBarcode,
} from "../services/api";

const MovimentacaoEstoque = () => {
  // Estado para termo digitado e sugestões dinâmicas
  const [termoBusca, setTermoBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);

  // Buscar produtos conforme o usuário digita
  useEffect(() => {
    let ativo = true;
    if (termoBusca.length > 0) {
      buscarProdutos(termoBusca).then((res) => {
        console.log("[Autocomplete] Resultado da busca:", res);
        if (ativo) setSugestoes(res);
      });
    } else {
      setSugestoes([]);
    }
    return () => {
      ativo = false;
    };
  }, [termoBusca]);
  const [tipoForm, setTipoForm] = useState("codigo");
  const [formCodigo, setFormCodigo] = useState({
    codigoProduto: "",
    tipo: "E",
    quantidade: "",
    usuario: "",
  });
  // Estado para lista de produtos e produto selecionado
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  // Buscar produtos ao montar o componente
  useEffect(() => {
    async function fetchProdutos() {
      try {
        const lista = await buscarProdutos();
        setProdutos(lista);
      } catch (err) {
        toastError("Erro ao buscar produtos");
      }
    }
    fetchProdutos();
  }, []);
  // Removido duplicidade, já está declarado acima
  const [formBarcode, setFormBarcode] = useState({
    codigo_barras: "",
    tipo: "E",
    usuario: "",
  });

  // Pega usuário logado do contexto
  const { user } = useAuth();

  // Preenche usuário automaticamente ao carregar
  useEffect(() => {
    if (user && user.nome) {
      setFormCodigo((prev) => ({ ...prev, usuario: user.nome }));
      setFormBarcode((prev) => ({ ...prev, usuario: user.nome }));
    }
  }, [user]);
  const [loading, setLoading] = useState(false);

  const handleChangeCodigo = (e) => {
    setFormCodigo({ ...formCodigo, [e.target.name]: e.target.value });
    // Validação removida, pois o autocomplete já controla produto selecionado
  }; // <-- Add missing closing bracket here

  const handleChangeBarcode = (e) => {
    setFormBarcode({ ...formBarcode, [e.target.name]: e.target.value });
  };

  const handleSubmitCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const codigoSelecionado = Number(
        produtoSelecionado?.codigo_interno ||
          produtoSelecionado?.CODIGO_INTERNO ||
          produtoSelecionado?.CODIGO,
      );
      if (!Number.isFinite(codigoSelecionado) || codigoSelecionado <= 0) {
        throw new Error("Selecione um produto válido");
      }

      const payload = {
        ...formCodigo,
        codigoProduto: codigoSelecionado,
        quantidade: Number(formCodigo.quantidade),
      };
      await movimentarEstoquePorCodigo(payload);
      toastSuccess("Movimentação registrada com sucesso!");
      setFormCodigo({
        codigoProduto: "",
        tipo: "E",
        quantidade: "",
        usuario: "",
      });
    } catch (err) {
      toastError(err.message || "Erro ao registrar movimentação");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBarcode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formBarcode,
        quantidade: Number(formBarcode.quantidade),
      };
      await movimentarEstoquePorBarcode(payload);
      toastSuccess("Movimentação registrada com sucesso!");
      setFormBarcode({
        codigo_barras: "",
        tipo: "E",
        quantidade: "",
        usuario: "",
      });
    } catch (err) {
      toastError(err.message || "Erro ao registrar movimentação");
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <Header title="Movimentação de Estoque" />

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Movimentação de Estoque
        </h1>
        <div className="flex justify-center mb-6 gap-4">
          <button
            type="button"
            className={`px-4 py-2 rounded ${
              tipoForm === "codigo" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTipoForm("codigo")}
          >
            Buscar por Código Interno
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded ${
              tipoForm === "barcode" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTipoForm("barcode")}
          >
            Buscar por Código de Barras
          </button>
        </div>
        {tipoForm === "codigo" ? (
          <form onSubmit={handleSubmitCodigo} className="space-y-4">
            <div>
              <label className="block font-medium">
                Código Interno do Produto
              </label>
              <Autocomplete
                options={
                  sugestoes.length > 0
                    ? sugestoes
                    : produtoSelecionado
                    ? [produtoSelecionado]
                    : []
                }
                getOptionLabel={(option) => {
                  if (!option) return "";
                  if (typeof option === "string") return option;
                  if (option.codigo_interno && option.DESCRICAO)
                    return `${option.codigo_interno} - ${option.DESCRICAO}`;
                  if (option.codigo_interno) return option.codigo_interno;
                  return "";
                }}
                value={produtoSelecionado}
                onChange={(_, newValue) => setProdutoSelecionado(newValue)}
                inputValue={termoBusca}
                onInputChange={(_, newInputValue) =>
                  setTermoBusca(newInputValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Código Interno"
                    variant="outlined"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) => {
                  if (!option || !value) return false;
                  return option.codigo_interno === value.codigo_interno;
                }}
                filterOptions={(options) => options}
              />
            </div>
            <div>
              <label className="block font-medium">Tipo de Movimentação</label>
              <select
                name="tipo"
                value={formCodigo.tipo}
                onChange={handleChangeCodigo}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="E">Entrada</option>
                <option value="S">Saída</option>
                <option value="I">Inventário</option>
              </select>
            </div>
            <div>
              <label className="block font-medium">Quantidade</label>
              <input
                type="number"
                name="quantidade"
                value={formCodigo.quantidade}
                onChange={handleChangeCodigo}
                className="w-full border rounded px-3 py-2"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block font-medium">Usuário</label>
              <input
                type="text"
                name="usuario"
                value={formCodigo.usuario}
                onChange={handleChangeCodigo}
                className="w-full border rounded px-3 py-2 bg-gray-100"
                required
                readOnly={!!user?.nome}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              disabled={loading || !produtoSelecionado}
            >
              {loading ? "Processando..." : "Registrar Movimentação"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitBarcode} className="space-y-4">
            <div>
              <label className="block font-medium">Código de Barras</label>
              <input
                type="text"
                name="codigo_barras"
                value={formBarcode.codigo_barras}
                onChange={handleChangeBarcode}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium">Tipo de Movimentação</label>
              <select
                name="tipo"
                value={formBarcode.tipo}
                onChange={handleChangeBarcode}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="E">Entrada</option>
                <option value="S">Saída</option>
                <option value="I">Inventário</option>
              </select>
            </div>
            <div>
              <label className="block font-medium">Quantidade</label>
              <input
                type="number"
                name="quantidade"
                value={formBarcode.quantidade}
                onChange={handleChangeBarcode}
                className="w-full border rounded px-3 py-2"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block font-medium">Usuário</label>
              <input
                type="text"
                name="usuario"
                value={formBarcode.usuario}
                onChange={handleChangeBarcode}
                className="w-full border rounded px-3 py-2 bg-gray-100"
                required
                readOnly={!!user?.nome}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Processando..." : "Registrar Movimentação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MovimentacaoEstoque;
