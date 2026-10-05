import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Header from "../components/Header";
import {
  api,
  createMarca,
  createFamilia,
  getProdutoById,
  getMarcas,
  getFamilias,
  getFornecedor,
  createProduto,
  updateProduto,
} from "../services/api";
import { toastSuccess, toastError } from "../services/toast";
import ProdutoFormComponent from "../components/ProdutoForm";

const ProdutoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fornecedorInicial = Number(params.get("fornecedor")) || "";
  const [formData, setFormData] = useState({
    CODIGO_INTERNO: "",
    DESCRICAO: "",
    CODIGO_BARRAS: "",
    ESTOQUE_MINIMO: 0,
    ESTOQUE_ATUAL: 0,
    CODIGO_MARCA: "",
    CODIGO_FAMILIA: "",
    VALOR_UNITARIO: 0,
    COD_FORNECEDOR: fornecedorInicial,
  });
  const [quickType, setQuickType] = useState(null);
  const [quickName, setQuickName] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [saving, setSaving] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [fornecedores, setFornecedores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const marcasData = await getMarcas({
        limit: 100,
        orderBy: "DESCRICAO",
        orderDir: "asc",
      });
      // Buscar todas as famílias, sem limite
      const familiasData = await getFamilias({
        limit: 10000,
        orderBy: "DESCRICAO",
        orderDir: "asc",
      });
      setMarcas(Array.isArray(marcasData) ? marcasData : marcasData.data || []);
      setFamilias(
        Array.isArray(familiasData) ? familiasData : familiasData.data || []
      );
      if (id) {
        try {
          const produtoData = await getProdutoById(id);
          setFormData(
            produtoData || {
              CODIGO_INTERNO: "",
              DESCRICAO: "",
              CODIGO_BARRAS: "",
              ESTOQUE_MINIMO: 0,
              ESTOQUE_ATUAL: 0,
              CODIGO_MARCA: "",
              CODIGO_FAMILIA: "",
              VALOR_UNITARIO: 0,
              COD_FORNECEDOR: "",
            }
          );
        } catch (error) {
          // Log detalhado para debug
          console.error("[ProdutoForm] Erro ao buscar produto:", {
            id,
            error,
            response: error?.response,
            message: error?.message,
            stack: error?.stack,
          });
          toastError("Produto não encontrado ou erro ao buscar produto.");
          navigate("/produtos");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const buscarFornecedores = async () => {
      const fornecedoresData = await getFornecedor({
        limit: 100,
        orderBy: "NOME",
        orderDir: "asc",
      });
      const lista = Array.isArray(fornecedoresData) ? fornecedoresData : fornecedoresData.data || [];
      if (fornecedorInicial && !lista.some(f => Number(f.CODIGO) === fornecedorInicial)) {
        const { data } = await api.get(`/fornecedor/${fornecedorInicial}`);
        if (data) lista.push(data);
      }
      setFornecedores(lista);
    };
    buscarFornecedores().catch(() => toastError("Erro ao carregar fornecedores."));
  }, [fornecedorInicial]);

  const openQuick = (type) => {
    setQuickType(type); setQuickName(""); setQuickError("");
  };
  const saveQuick = async (e) => {
    e.preventDefault();
    if (quickSaving) return;
    const description = quickName.trim();
    if (!description) { setQuickError("Informe a descrição."); return; }
    setQuickSaving(true); setQuickError("");
    try {
      const isMarca = quickType === "marca";
      const getOptions = isMarca ? getMarcas : getFamilias;
      const response = await getOptions({ search: description, limit: 100, orderBy: "DESCRICAO" });
      const options = Array.isArray(response) ? response : response.data || [];
      const existing = options.find(o => o.DESCRICAO?.trim().toLocaleLowerCase() === description.toLocaleLowerCase());
      const created = existing || await (isMarca ? createMarca : createFamilia)({ DESCRICAO: description });
      const codigo = Number(created?.CODIGO);
      if (!Number.isSafeInteger(codigo) || codigo <= 0) throw new Error("Cadastro enviado, mas o código não foi confirmado. Confira a lista antes de tentar novamente.");
      const option = { ...created, CODIGO: codigo, DESCRICAO: created.DESCRICAO || description };
      const setOptions = isMarca ? setMarcas : setFamilias;
      setOptions(list => [...list.filter(o => Number(o.CODIGO) !== codigo), option].sort((a, b) => a.DESCRICAO.localeCompare(b.DESCRICAO)));
      setFormData(data => ({ ...data, [isMarca ? "CODIGO_MARCA" : "CODIGO_FAMILIA"]: codigo }));
      setQuickType(null);
      toastSuccess(existing ? "Cadastro existente selecionado." : "Cadastro criado e selecionado!");
    } catch (error) {
      setQuickError(error.response?.data?.error || error.message || "Não foi possível salvar o cadastro.");
    } finally { setQuickSaving(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (id) {
        await updateProduto(id, formData);
        toastSuccess("Produto atualizado com sucesso!");
      } else {
        await createProduto(formData);
        toastSuccess("Produto criado com sucesso!");
      }
      navigate(fornecedorInicial ? "/fornecedores" : "/produtos");
    } catch (error) {
      toastError(error.response?.data?.error || "Erro ao salvar produto");
    } finally { setSaving(false); }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Header />
      <ProdutoFormComponent
        formData={formData}
        marcas={marcas}
        familias={familias}
        fornecedores={fornecedores}
        loading={loading}
        saving={saving || quickSaving}
        onCreateMarca={() => openQuick("marca")}
        onCreateFamilia={() => openQuick("familia")}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/produtos")}
        isEdit={!!id}
      />
      <Dialog open={!!quickType} onClose={() => { if (!quickSaving) setQuickType(null); }} fullWidth maxWidth="sm" disableEscapeKeyDown={quickSaving}>
        <form onSubmit={saveQuick}>
          <DialogTitle>{quickType === "marca" ? "Nova marca" : "Nova família"}</DialogTitle>
          <DialogContent>
            <p className="mb-4">O cadastro será salvo e selecionado neste produto. Os dados do produto serão mantidos.</p>
            <TextField autoFocus fullWidth required label="Descrição" value={quickName} disabled={quickSaving} onChange={e => setQuickName(e.target.value)} margin="dense" />
            {quickError && <p role="alert" className="text-red-700 mt-2">{quickError}</p>}
          </DialogContent>
          <DialogActions>
            <Button disabled={quickSaving} onClick={() => setQuickType(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={quickSaving}>{quickSaving ? "Salvando…" : "Salvar e selecionar"}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ProdutoForm;
