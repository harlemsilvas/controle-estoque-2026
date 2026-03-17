// Relatório de movimentações de estoque
export const getMovimentacoes = async ({
  dataInicio,
  dataFim,
  limit = 10,
  orderBy = "data DESC",
  page = 1,
} = {}) => {
  const params = {};
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;
  if (limit) params.limit = limit;
  if (orderBy) params.orderBy = orderBy;
  if (page) params.page = page;
  const response = await api.get("/relatorio/movimentacoes", { params });
  return response.data;
};
import axios from "axios";
import { API_BASE_URL } from "../config/apiBaseUrl";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Função para obter totais
export const getTotais = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token não encontrado.");

    const response = await api.get("/totais", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.message || "Erro ao buscar totais.");
  }
};
// export const getTotais = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     const response = await api.get("/totais", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     throw new Error("Erro ao buscar totais.");
//   }
// };

// Função para obter totais
// export const getTotais = async () => {
//   try {
//     const response = await api.get("/totais");
//     return response.data;
//   } catch (error) {
//     throw new Error("Erro ao buscar totais.");
//   }
// };

// Novo: aceita params para paginação, filtro e ordenação
export const getProdutos = async ({
  page = 1,
  limit = 20,
  fornecedor,
  marca,
  familia,
  search,
  orderBy = "CODIGO",
  orderDir = "asc",
} = {}) => {
  const params = {
    page,
    limit,
    fornecedor,
    marca,
    familia,
    orderBy,
    orderDir,
  };
  if (search !== undefined) params.search = search;
  const response = await api.get("/produto", { params });
  return response.data;
};

export const getEstoque = async () => {
  const response = await api.get("/estoque-produto");
  return response.data;
};

// Adicione outras funções conforme necessário
export const getProdutoById = async (id) => {
  const response = await api.get(`/produto/${id}`);
  return response.data;
};

export const getMarca = async (codigoMarca) => {
  const response = await api.get(`/marca/${codigoMarca}`);
  // Se vier array, retorna o primeiro, senão retorna o objeto direto
  if (Array.isArray(response.data)) {
    return response.data[0];
  }
  return response.data;
};

export const getmarca = async (codigomarca) => {
  const response = await api.get(`/marca/${codigomarca}`);
  return response.data[0];
};

export const getFamilia = async (codigoFamilia) => {
  const response = await api.get(`/familia/${codigoFamilia}`);
  if (Array.isArray(response.data)) {
    return response.data[0];
  }
  return response.data;
};

// export const getFamilias = async () => {
//   const response = await api.get("/familia");
//   return response.data;
// };

export async function getFamilias(params) {
  const response = await api.get("/familia/paginado", { params });
  return response.data;
}

export const getMarcas = async ({
  page = 1,
  limit = 10,
  search = "",
  orderBy = "DESCRICAO",
  orderDir = "asc",
} = {}) => {
  const response = await api.get("/marca", {
    params: { page, limit, search, orderBy, orderDir },
  });
  return response.data;
};

// export const getmarcas = async () => {
//   const response = await api.get("/marca");
//   return response.data;
// };

export const createProduto = async (produto) => {
  const response = await api.post("/produto", produto);
  return response.data;
};

export const updateProduto = async (id, produto) => {
  const response = await api.put(`/produto/${id}`, produto);
  return response.data;
};

export const deleteProduto = async (id) => {
  const response = await api.delete(`/produto/${id}`);
  return response.data;
};

export const createMarca = async (marca) => {
  try {
    await api.post("/marca", marca);
  } catch (error) {
    throw new Error(error.response?.data || "Erro ao criar marca");
  }
  // return response.data;
};

export const updateMarca = async (id, marca) => {
  const response = await api.put(`/marca/${id}`, marca);
  return response.data;
};

export const getProdutosLixeira = async () => {
  const response = await api.get("/produtos/lixeira");
  return response.data;
};

export const restaurarProduto = async (id) => {
  const response = await api.post(`/produtos/restaurar/${id}`);
  return response.data;
};

export const excluirPermanentemente = async (id, cascade = false) => {
  try {
    const url = `/produtos/lixeira/${id}` + (cascade ? "?cascade=true" : "");
    const response = await api.delete(url);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Retorna mensagem e vínculos para o front decidir
      return {
        success: false,
        error: error.response.data.error,
        vinculos: error.response.data.vinculos,
      };
    }
    throw new Error(error.response?.data?.message || "Erro ao excluir produto");
  }
};

export const getLixeiraCount = async () => {
  try {
    const response = await api.get("/produto/lixeira/count");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Erro ao buscar contagem da lixeira"
    );
  }
};

export const getAlertas = async () => {
  const response = await api.get("/alertas");
  return response.data;
};

// Alertas
export const resolveAlerta = async (id, usuario) => {
  try {
    const response = await api.patch(`/alertas/resolver/${id}`, { usuario });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erro ao resolver alerta");
  }
};

// export const getEstoqueTemp = async () => {
//   const response = await api.get("/estoque/temp");
//   return response.data;
// };

export const addItemTemp = async (item) => {
  const response = await api.post("/estoque/temp", item);
  return response.data;
};

export const processarLoteEstoque = async () => {
  const response = await api.post("/estoque/processar");
  return response.data;
};

export const getEstoqueTemp = async () => {
  try {
    const response = await api.get("/estoque/temp");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.details || "Erro desconhecido");
  }
};

export const getProdutoPorBarcode = async (barcode) => {
  const response = await api.get(`/produto/barcode/${barcode}`);
  return response.data;
};

export const getHistoricoEstoque = async (barcode) => {
  const response = await api.get(`/estoque/historico/${barcode}`);
  return response.data;
};

// export const registrarMovimentacao = async (data) => {
//   const response = await api.post("/estoque/movimentacao", data);
//   return response.data;
// };

// export const buscarProdutos = async (termo) => {
//   const response = await api.get(`/produtos/busca/${termo}`, {
//     params: { termo },
//   });
//   return response.data;
// };

// services/api.js
export const buscarProdutos = async (termo) => {
  try {
    const response = await api.get("/produtos/busca", {
      params: {
        termo: termo || "", // Parâmetro deve ser "termo", não "search"
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Erro na busca");
  }
};

const normalizarCodigoProduto = (codigoProduto) => {
  const codigoNum = Number(codigoProduto);
  if (!Number.isInteger(codigoNum) || codigoNum <= 0) return null;
  return codigoNum;
};

const obterCodigoProduto = (payload = {}) => {
  return (
    payload.codigoProduto ??
    payload.codigo_interno ??
    payload.CODIGO_INTERNO ??
    payload.CODIGO ??
    payload.produto?.codigo_interno ??
    payload.produto?.CODIGO_INTERNO ??
    payload.produto?.CODIGO
  );
};

export const registrarMovimentacao = async (data) => {
  const codigoProduto = normalizarCodigoProduto(obterCodigoProduto(data));
  if (!codigoProduto) {
    throw new Error("codigoProduto inválido no front-end");
  }

  const response = await api.post("/estoque/movimentar", {
    ...data,
    codigoProduto,
  });
  return response.data;
};

// Fornecedores paginados
export const getFornecedor = async ({
  page = 1,
  limit = 10,
  search = "",
  orderBy = "NOME",
  orderDir = "asc",
} = {}) => {
  const response = await api.get("/fornecedor", {
    params: { page, limit, search, orderBy, orderDir },
  });
  return response.data;
};

export const createFornecedor = async (fornecedor) => {
  const response = await api.post("/fornecedor", fornecedor);
  return response.data;
};

export const updateFornecedor = async (codigo, fornecedor) => {
  const response = await api.put(`/fornecedor/${codigo}`, fornecedor);
  return response.data;
};

export const deleteFornecedor = async (codigo, force = false) => {
  const url = force
    ? `/fornecedor/${codigo}?force=true`
    : `/fornecedor/${codigo}`;
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Backend retorna 409 e pode incluir lista de vínculos
      return {
        vinculos: error.response.data?.vinculos || [],
        message:
          error.response.data?.message ||
          "Existem registros vinculados a este fornecedor.",
      };
    }
    throw error;
  }
};

export const getProdutoAggregate = async () => {
  try {
    const response = await api.get("/produto-aggregate");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || "Erro na busca de produtos/marcas"
    );
  }
};

export const updateFamilia = async (codigo, familia) => {
  const response = await api.put(`/familia/${codigo}`, familia);
  return response.data;
};
// Compatibilidade: getEstoqueData (usado no Dashboard)
export const getEstoqueData = async () => {
  return getEstoque();
};

export const getAlertasHistorico = async () => {
  const response = await api.get("/alertas/historico");
  return response.data;
};
export const deleteMarca = async (codigo, force = false) => {
  const url = force ? `/marca/${codigo}?force=true` : `/marca/${codigo}`;
  const response = await api.delete(url);
  return response.data;
};
export const deleteFamilia = async (codigo, force = false) => {
  const url = force ? `/familia/${codigo}?force=true` : `/familia/${codigo}`;
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return {
        vinculos: error.response.data?.vinculos || [],
        message:
          error.response.data?.message ||
          "Existem registros vinculados a esta família.",
      };
    }
    throw error;
  }
};
export const createFamilia = async (familia) => {
  const response = await api.post("/familia", familia);
  return response.data;
};

// Movimentação por código do produto
export const movimentarEstoquePorCodigo = async ({
  codigoProduto,
  tipo,
  quantidade,
  usuario,
  produto,
  CODIGO,
  CODIGO_INTERNO,
  codigo_interno,
}) => {
  const codigoProdutoNormalizado = normalizarCodigoProduto(
    obterCodigoProduto({
      codigoProduto,
      produto,
      CODIGO,
      CODIGO_INTERNO,
      codigo_interno,
    })
  );

  if (!codigoProdutoNormalizado) {
    throw new Error("codigoProduto inválido no front-end");
  }

  const response = await api.post("/estoque/movimentar", {
    codigoProduto: codigoProdutoNormalizado,
    tipo,
    quantidade,
    usuario,
  });
  return response.data;
};

// Movimentação por código de barras
export const movimentarEstoquePorBarcode = async ({
  codigo_barras,
  tipo,
  quantidade,
  usuario,
}) => {
  const response = await api.post("/estoque/movimentacao", {
    codigo_barras,
    tipo,
    quantidade,
    usuario,
  });
  return response.data;
};
