import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { ErrorBoundary } from './layout/ErrorBoundary';
import { DirectPermissionsPage } from './pages/DirectPermissionsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { GroupsPage } from './pages/GroupsPage';
import { MatrixPage } from './pages/MatrixPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverviewPage } from './pages/OverviewPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { PlansPage } from './pages/PlansPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SearchPage } from './pages/SearchPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:userId" element={<UserDetailPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="groups/:groupId" element={<GroupDetailPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="matrix" element={<MatrixPage />} />
              <Route path="direct-permissions" element={<DirectPermissionsPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="plans/:planId" element={<PlanDetailPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </FluentProvider>
  );
}
