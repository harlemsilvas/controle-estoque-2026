import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import MeusAcessos from "./pages/MeusAcessos";
import AdminPerfis from "./pages/Admin/AdminPerfis";
import PermissionRoute from "./components/PermissionRoute";
import Home from "./pages/Home";
import LancamentoEstoque from "./pages/LancamentoEstoque";
import Login from "./pages/LoginPage"; // Importe a página de login
import Register from "./pages/RegisterPage"; // Importe a página de registro
import "./index.css";
import Produtos from "./pages/Produtos";
import ProdutoDetalhes from "./pages/ProdutoDetalhes";
import ProdutoForm from "./pages/ProdutoForm";
import { AuthProvider } from "./context/AuthContext.jsx"; // Importe o AuthProvider
import Dashboard from "./pages/Dashboard";
import FamiliaProdutoPage from "./pages/FamiliaProdutoPage";
import MarcaProdutoPage from "./pages/MarcaProdutoPage";
import LixeiraProdutos from "./pages/LixeiraProdutos";
import AlertasHistorico from "./pages/AlertasHistorico";
import MovimentacaoEstoque from "./pages/MovimentacaoEstoque";
import NovaMovimentacaoEstoque from "./pages/NovaMovimentacaoEstoque";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RegisterPage from "./pages/RegisterPage";
import RecoverPage from "./pages/RecoverPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FornecedorProdutoPage from "./pages/FornecedorProdutoPage";
import AdminMenu from "./pages/Admin/AdminMenu";
import AdminTotalizacao from "./pages/Admin/AdminTotalizacao"; // Importe a página de totalização
import AdminTotalizacaoFamilia from "./pages/Admin/AdminTotalizacaoFamilia";
import AdminTotalizacaoMarca from "./pages/Admin/AdminTotalizacaoMarca";
import AdminTotalizacaoFornecedor from "./pages/Admin/AdminTotalizacaoFornecedor";
import AdminLayout from "./components/Admin/AdminLayout"; // Importe o layout administrativo
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminRelatorios from "./pages/Admin/AdminRelatorios";
import AdminUsuarios from "./pages/Admin/AdminUsuarios";
import AdminEtiquetas from "./pages/Admin/AdminEtiquetas";
import AdminConfiguracoes from "./pages/Admin/AdminConfiguracoes";
import AdminRelatorioMarcas from "./pages/Admin/AdminRelatorioMarcas";
import AdminRelatorioFamilias from "./pages/Admin/AdminRelatorioFamilias";
import AdminRelatorioFornecedores from "./pages/Admin/AdminRelatorioFornecedores";
import RelatorioMovimentacoes from "./pages/RelatorioMovimentacoes.jsx";
import PrivateRoute from "./components/PrivateRoute";
import ApiRoutesCheck from "./pages/ApiRoutesCheck";
import ConfiguracoesLancamento from "./pages/ConfiguracoesLancamento";
//const user = { username: "admin" }; // Simulação de usuário logado

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AdminRoute permission="users.create"><Register /></AdminRoute>} />
          {/* Rotas protegidas */}
          {/* <Route path="/" element={<Home />} /> */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <PermissionRoute permission="products.read">
                <Produtos />
              </PermissionRoute>
            }
          />
          <Route
            path="/produto/:id"
            element={
              <PermissionRoute permission="products.read">
                <ProdutoDetalhes />
              </PermissionRoute>
            }
          />
          {/* // Adicionar novas rotas */}
          <Route path="/produto/novo" element={<AdminRoute permission="products.create"><ProdutoForm /></AdminRoute>} />
          <Route
            path="/produto/editar/:id"
            element={
              <AdminRoute permission="products.edit">
                <ProdutoForm />
              </AdminRoute>
            }
          />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route
            path="/familias"
            element={
              <PermissionRoute permission="families.read">
                <FamiliaProdutoPage />
              </PermissionRoute>
            }
          />
          {/* Rota para movimentação de estoque com histórico na tela*/}
          <Route
            path="/estoque/movimentacaohistorico"
            element={
              <PermissionRoute permission="stock.read">
                <MovimentacaoEstoque />
              </PermissionRoute>
            }
          />
          {/* Nova rota para movimentação de estoque */}
          {/* Rota para lançamentos de estoque modernos */}
          <Route
            path="/estoque/lancamento"
            element={
              <PermissionRoute permission="stock.move">
                <LancamentoEstoque />
              </PermissionRoute>
            }
          />
          <Route
            path="/estoque/movimentacao"
            element={
              <PermissionRoute permission="stock.move">
                <NovaMovimentacaoEstoque />
              </PermissionRoute>
            }
          />
          <Route
            path="/marcas"
            element={
              <PermissionRoute permission="brands.read">
                <MarcaProdutoPage />
              </PermissionRoute>
            }
          />
          {/* <Route
          path="/cadastro-fornecedor"
          element={
            <ProtectedRoute>
              <CadastroFornecedor />
            </ProtectedRoute>
          }
        /> */}
          <Route path="/produtos/lixeira" element={<PermissionRoute permission="trash.read"><LixeiraProdutos /></PermissionRoute>} />
          <Route
            path="/fornecedores"
            element={
              <PermissionRoute permission="suppliers.read">
                <FornecedorProdutoPage />
              </PermissionRoute>
            }
          />
          <Route path="/alertas/historico" element={<PermissionRoute permission="alerts.read"><AlertasHistorico /></PermissionRoute>} />
          <Route path="/forgot-password" element={<RecoverPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/api-check" element={<AdminRoute><ApiRoutesCheck /></AdminRoute>} />
          <Route
            path="/configuracoes/lancamento"
            element={
              <AdminRoute permission="settings.read">
                <ConfiguracoesLancamento />
              </AdminRoute>
            }
          />

          <Route path="/relatorios" element={<ProtectedRoute><Header /><PermissionRoute permission="reports.read"><RelatorioMovimentacoes /></PermissionRoute></ProtectedRoute>} />
          <Route path="/relatorios/movimentacoes" element={<Navigate to="/relatorios" replace />} />

          <Route path="/conta/acessos" element={<ProtectedRoute><MeusAcessos /></ProtectedRoute>} />

          <Route path="/relatorios/fornecedores" element={<ProtectedRoute><Header /><PermissionRoute permission="reports.read"><AdminRelatorioFornecedores /></PermissionRoute></ProtectedRoute>} />
          <Route path="/relatorios/marcas" element={<ProtectedRoute><Header /><PermissionRoute permission="reports.read"><AdminRelatorioMarcas /></PermissionRoute></ProtectedRoute>} />
          <Route path="/relatorios/familias" element={<ProtectedRoute><Header /><PermissionRoute permission="reports.read"><AdminRelatorioFamilias /></PermissionRoute></ProtectedRoute>} />
          {/* Rotas administrativas */}
          {/* <Route path="/admin" element={<AdminLayout user={user} />}> */}
          {/* Rotas protegidas */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<PermissionRoute permission="reports.read"><AdminDashboard /></PermissionRoute>} />
            <Route path="totais" element={<PermissionRoute permission="reports.read"><AdminMenu /></PermissionRoute>} />
            <Route path="relatorios" element={<PermissionRoute permission="reports.read"><AdminRelatorios /></PermissionRoute>} />
            <Route
              path="relatorios/marcas"
              element={<PermissionRoute permission="reports.read"><AdminRelatorioMarcas /></PermissionRoute>}
            />
            <Route
              path="relatorios/fornecedores"
              element={<PermissionRoute permission="reports.read"><AdminRelatorioFornecedores /></PermissionRoute>}
            />
            <Route
              path="relatorios/familias"
              element={<PermissionRoute permission="reports.read"><AdminRelatorioFamilias /></PermissionRoute>}
            />
            <Route
              path="relatorios/movimentacoes"
              element={<PermissionRoute permission="reports.read"><RelatorioMovimentacoes /></PermissionRoute>}
            />
            <Route path="usuarios" element={<PermissionRoute permission="users.read"><AdminUsuarios /></PermissionRoute>} />
            <Route path="perfis" element={<PermissionRoute permission="profiles.read"><AdminPerfis /></PermissionRoute>} />
            <Route path="etiquetas" element={<PermissionRoute permission="products.read"><AdminEtiquetas /></PermissionRoute>} />
            <Route path="configuracoes" element={<PermissionRoute permission="settings.read"><AdminConfiguracoes /></PermissionRoute>} />

            <Route
              path="totalizacao/familia"
              element={<PermissionRoute permission="reports.read"><AdminTotalizacaoFamilia /></PermissionRoute>}
            />
            <Route
              path="totalizacao/marca"
              element={<PermissionRoute permission="reports.read"><AdminTotalizacaoMarca /></PermissionRoute>}
            />
            <Route
              path="totalizacao/fornecedor"
              element={<PermissionRoute permission="reports.read"><AdminTotalizacaoFornecedor /></PermissionRoute>}
            />
            <Route path="totalizacao" element={<PermissionRoute permission="reports.read"><AdminTotalizacao /></PermissionRoute>} />
            {/* /admin/totalizacao/produto */}
            <Route path="totalizacao/produto" element={<PermissionRoute permission="reports.read"><AdminTotalizacao /></PermissionRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>

    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      className="toast-container"
    />
  </React.StrictMode>
);
