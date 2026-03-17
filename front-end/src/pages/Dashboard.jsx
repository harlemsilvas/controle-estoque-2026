// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Header from "../components/Header";
import { getEstoqueData, getProdutoAggregate } from "../services/api";
import { toastError } from "../services/toast";
import _ from "lodash";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const Dashboard = () => {
  const [stockMais, setStockMais] = useState([]);
  const [stockMenos, setStockMenos] = useState([]);
  const [aggregateData, setAggregateData] = useState({
    byFamily: [],
    byMarca: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stock = await getEstoqueData();
        const aggregate = await getProdutoAggregate();
        setStockMais(stock.maisEstoque || []);
        setStockMenos(stock.menosEstoque || []);
        setAggregateData(aggregate);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error.message);
        toastError(error.message || "Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="text-center mt-8">Carregando dashboard...</div>;

  // Unifica os produtos dos dois arrays e filtra para alertas (estoque atual < estoque mínimo), sem duplicidade
  const alertasEstoque = [...stockMais, ...stockMenos].filter(
    (p, i, arr) =>
      p.ESTOQUE_ATUAL < (p.ESTOQUE_MINIMO || 0) &&
      arr.findIndex((x) => x.CODIGO === p.CODIGO) === i
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={"Dashboard´s Page"} />

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Dashboard de Estoque
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico 1: 15 Produtos com MAIS estoque */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Top 15 Produtos com Mais Estoque
            </h2>
            <BarChart width={500} height={300} data={stockMais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="DESCRICAO" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="ESTOQUE_ATUAL"
                fill="#8884d8"
                name="Estoque Atual"
              />
            </BarChart>
          </div>

          {/* Gráfico 2: 15 Produtos com MENOS estoque */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Top 15 Produtos com Menos Estoque
            </h2>
            <BarChart width={500} height={300} data={stockMenos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="DESCRICAO" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="ESTOQUE_ATUAL"
                fill="#82ca9d"
                name="Estoque Atual"
              />
            </BarChart>
          </div>
        </div>

        {/* Gráfico 3: Distribuição por Família (Top 10) */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Top 10 Famílias com Mais Produtos
          </h2>
          <PieChart width={500} height={300}>
            <Pie
              data={aggregateData.byFamily
                .slice() // cópia para não mutar o original
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .slice(0, 10)}
              dataKey="total"
              nameKey="FAMILIA"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {aggregateData.byFamily
                .slice()
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .slice(0, 10)
                .map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        {/* Gráfico 4: Alertas de Estoque */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Alertas de Estoque</h2>
          <BarChart width={1000} height={300} data={alertasEstoque}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="DESCRICAO" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ESTOQUE_ATUAL" fill="#ff7300" name="Estoque Atual" />
            <Bar
              dataKey="ESTOQUE_MINIMO"
              fill="#ff0000"
              name="Estoque Mínimo"
            />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
