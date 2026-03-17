import React, { useEffect, useState } from "react";
import Header from "../components/Header";

const STORAGE_KEY = "lancamentoEstoqueConfig";

const defaultConfig = {
  autoLancarPorLeitura: false,
  beepErro: true,
  tempoLimpezaErroMs: 1000,
};

const ConfiguracoesLancamento = () => {
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleChange = (field, value) => {
    const updated = { ...config, [field]: value };
    setConfig(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore storage errors
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <Header title="Configurações" />
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-4">
          Configurações de Lançamento de Estoque
        </h1>
        <div className="mb-4 p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
          Estas configurações controlam o comportamento da tela de Lançamento de
          Estoque, especialmente para uso com leitor de código de barras. No
          futuro, elas poderão ser movidas para uma área de configurações mais
          completa.
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <input
              id="cfg-auto-lancar"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={config.autoLancarPorLeitura}
              onChange={(e) =>
                handleChange("autoLancarPorLeitura", e.target.checked)
              }
            />
            <label htmlFor="cfg-auto-lancar" className="text-sm text-gray-800">
              <span className="font-medium">
                Lançar automaticamente cada leitura de código de barras
              </span>
              <br />
              Quando ativado, cada EAN lido entra direto no grid com quantidade
              1, usando o mesmo tipo da última movimentação.
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="cfg-beep-erro"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={config.beepErro}
              onChange={(e) => handleChange("beepErro", e.target.checked)}
            />
            <label htmlFor="cfg-beep-erro" className="text-sm text-gray-800">
              <span className="font-medium">Emitir alerta sonoro em erro</span>
              <br />
              Toca um beep curto quando o produto não é encontrado ou ocorre
              erro na leitura do código de barras.
            </label>
          </div>

          <div className="flex flex-col gap-1 max-w-xs">
            <label
              htmlFor="cfg-tempo-limpeza"
              className="text-sm font-medium text-gray-800"
            >
              Tempo para limpar campo após erro (ms)
            </label>
            <input
              id="cfg-tempo-limpeza"
              type="number"
              min={200}
              max={5000}
              step={100}
              className="border rounded px-3 py-2 text-sm"
              value={config.tempoLimpezaErroMs}
              onChange={(e) => {
                const value = parseInt(e.target.value || "0", 10) || 0;
                const clamped = Math.min(Math.max(value, 200), 5000);
                handleChange("tempoLimpezaErroMs", clamped);
              }}
            />
            <span className="text-xs text-gray-500">
              Padrão: 1000 ms (1 segundo). Valores muito baixos podem não dar
              tempo de ver a mensagem.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesLancamento;
