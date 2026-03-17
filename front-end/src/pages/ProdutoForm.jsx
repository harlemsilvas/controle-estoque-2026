import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import {
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
  const [formData, setFormData] = useState({
    CODIGO_INTERNO: "",
    DESCRICAO: "",
    CODIGO_BARRAS: "",
    ESTOQUE_MINIMO: 0,
    ESTOQUE_ATUAL: 0,
    CODIGO_MARCA: "",
    CODIGO_FAMILIA: "",
    VALOR_UNITARIO: 0,
    COD_FORNECEDOR: "",
  });
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
      setFornecedores(
        Array.isArray(fornecedoresData)
          ? fornecedoresData
          : fornecedoresData.data || []
      );
    };
    buscarFornecedores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await updateProduto(id, formData);
        toastSuccess("Produto atualizado com sucesso!");
      } else {
        await createProduto(formData);
        toastSuccess("Produto criado com sucesso!");
      }
      navigate("/produtos");
    } catch (error) {
      toastError(error.response?.data || "Erro ao salvar produto");
    }
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
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/produtos")}
        isEdit={!!id}
      />
    </>
  );
};

export default ProdutoForm;
