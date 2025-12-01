import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { NewPostWizard } from './pages/NewPostWizard';
import { PostDetail } from './pages/PostDetail';
import { VideoLibrary } from './pages/VideoLibrary';
import { WeeklySchedulePage } from './pages/WeeklySchedule';
import { DesignSystemButtonsPage } from './pages/DesignSystemButtons';
import { DesignSystemFormsPage } from './pages/DesignSystemForms';
import { DesignSystemDayCardsPage } from './pages/DesignSystemDayCards';
import { DesignSystemActionCardPage } from './pages/DesignSystemActionCard';

function App() {
  console.log('App component rendering');
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<NewPostWizard />} />
          <Route path="/weekly" element={<WeeklySchedulePage />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/videos" element={<VideoLibrary />} />
          <Route path="/design/buttons" element={<DesignSystemButtonsPage />} />
          <Route path="/design/forms" element={<DesignSystemFormsPage />} />
          <Route path="/design/day-cards" element={<DesignSystemDayCardsPage />} />
          <Route path="/design/action-card" element={<DesignSystemActionCardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
