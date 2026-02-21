import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import BankAccountsPage from './pages/BankAccountsPage';
import IdsCardsPage from './pages/IdsCardsPage';
import LiquidAssetsPage from './pages/LiquidAssetsPage';
import FixedDepositsPage from './pages/FixedDepositsPage';
import MutualFundsPage from './pages/MutualFundsPage';
import IlliquidAssetsPage from './pages/IlliquidAssetsPage';
import RetirementTrackerPage from './pages/RetirementTrackerPage';
import DocumentVaultPage from './pages/DocumentVaultPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter basename="/dad-finance-tracker">
      <DemoProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/bank-accounts" element={<BankAccountsPage />} />
            <Route path="/ids-cards" element={<IdsCardsPage />} />
            <Route path="/liquid" element={<LiquidAssetsPage />} />
            <Route path="/liquid/fds" element={<FixedDepositsPage />} />
            <Route path="/liquid/mfs" element={<MutualFundsPage />} />
            <Route path="/illiquid" element={<IlliquidAssetsPage />} />
            <Route path="/retirement" element={<RetirementTrackerPage />} />
            <Route path="/documents" element={<DocumentVaultPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </DemoProvider>
    </BrowserRouter>
  );
}
