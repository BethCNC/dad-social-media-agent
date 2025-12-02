import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { NewPostWizard } from './pages/NewPostWizard';
import { PostDetail } from './pages/PostDetail';
import { VideoLibrary } from './pages/VideoLibrary';
import { WeeklySchedulePage } from './pages/WeeklySchedule';
import { ContentBankPage } from './pages/ContentBankPage';

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<NewPostWizard />} />
          <Route path="/weekly" element={<WeeklySchedulePage />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/videos" element={<VideoLibrary />} />
          <Route path="/bank" element={<ContentBankPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
