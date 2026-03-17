import React, { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import ConfirmationModal from "./ConfirmationModal";
import { getAlertas, resolveAlerta } from "../services/api";
import { toastSuccess, toastError } from "../services/toast";
import { useAuth } from "../hooks/useAuth";

const AlertBadge = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const { user } = useAuth();

  const loadAlerts = async () => {
    try {
      const data = await getAlertas();
      setAlerts(data);
      setAlertCount(data.length);
    } catch (error) {
      toastError(error.message || "Erro ao carregar alertas");
    }
  };

  const handleResolveConfirm = async () => {
    try {
      await resolveAlerta(selectedAlert.ID, user?.username || "admin"); // Usa username do usuário autenticado
      // Remover o alerta resolvido da lista localmente
      setAlerts(alerts.filter((a) => a.ID !== selectedAlert.ID));
      setAlertCount((prev) => prev - 1);
      toastSuccess("Alerta resolvido com sucesso!");
      setShowResolveModal(false);
    } catch (error) {
      toastError(error.message || "Erro ao resolver alerta");
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 300000); // Atualiza a cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowAlerts(!showAlerts)}
        className="p-2 text-gray-600 hover:text-blue-600 relative"
      >
        <BellIcon className="h-6 w-6" />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {alertCount}
          </span>
        )}
      </button>

      {showAlerts && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Alertas Ativos</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.ID} className="p-4 border-b hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-red-600">
                      Estoque Mínimo Atingido
                    </div>
                    <div className="text-sm">{alert.PRODUTO_DESCRICAO}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Estoque: {alert.ESTOQUE_ATUAL} | Mínimo:{" "}
                      {alert.ESTOQUE_MINIMO}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowResolveModal(true);
                    }}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    Resolver
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-4 text-gray-500">Nenhum alerta ativo</div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onConfirm={handleResolveConfirm}
        title="Confirmar Resolução"
        message="Tem certeza que deseja marcar este alerta como resolvido?"
        confirmText="Confirmar Resolução"
        cancelText="Cancelar"
        confirmColor="bg-green-600 hover:bg-green-700"
      />
    </div>
  );
};

export default AlertBadge;
