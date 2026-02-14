import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Import individual project apps
import ComponentLibraryApp from './pages/component-library/App';
import SettingsWindowApp from './pages/settings-window/App';
import AuralogApp from './pages/auralog/App';
import TypoZeroApp from './pages/typozero/App';
import AppBooksApp from './pages/appbooks/App';
import SoftGlassApp from './pages/soft-glass/App';
import RetroGlassUI from './pages/retro-glass-ui';
import VoiceNotesStepApp from './pages/voice-notes-step/App';
import VoiceNotesDashApp from './pages/voice-notes-dash/App';
import MeetingRecorderMacosApp from './pages/meeting-recorder-macos/App';
import MeetingRecorderMacosSettings from './pages/meeting-recorder-macos/Settings';

import './styles/globals.css';

// Layout wrapper for each project
function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Design System Projects */}
        <Route 
          path="/component-library" 
          element={
            <ProjectLayout>
              <ComponentLibraryApp />
            </ProjectLayout>
          } 
        />
        <Route 
          path="/settings-window" 
          element={
            <ProjectLayout>
              <SettingsWindowApp />
            </ProjectLayout>
          } 
        />
        <Route 
          path="/auralog" 
          element={
            <ProjectLayout>
              <AuralogApp />
            </ProjectLayout>
          } 
        />
        <Route 
          path="/typozero" 
          element={
            <ProjectLayout>
              <TypoZeroApp />
            </ProjectLayout>
          } 
        />
        <Route 
          path="/appbooks" 
          element={
            <ProjectLayout>
              <AppBooksApp />
            </ProjectLayout>
          } 
        />
        <Route
          path="/soft-glass"
          element={
            <ProjectLayout>
              <SoftGlassApp />
            </ProjectLayout>
          }
        />
        <Route
          path="/retro-glass-ui"
          element={
            <ProjectLayout>
              <RetroGlassUI />
            </ProjectLayout>
          }
        />
        <Route
          path="/voice-notes-step"
          element={
            <ProjectLayout>
              <VoiceNotesStepApp />
            </ProjectLayout>
          }
        />
        <Route
          path="/voice-notes-dash"
          element={
            <ProjectLayout>
              <VoiceNotesDashApp />
            </ProjectLayout>
          }
        />
        <Route
          path="/meeting-recorder-macos"
          element={
            <ProjectLayout>
              <MeetingRecorderMacosApp />
            </ProjectLayout>
          }
        />
        <Route
          path="/meeting-recorder-macos/settings"
          element={
            <ProjectLayout>
              <MeetingRecorderMacosSettings />
            </ProjectLayout>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
