import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/utils/toastContext';
import Home from './components/Home';
import ModelFileList from './components/pages/3dmodel/3DImageList';
import Model3DViewer from './components/pages/3dmodel/3DImageViewer';
import ImageFileList from './components/pages/360/360ImageList';
import Image360Viewer from './components/pages/360/360ImageViewer';
import VideoList from './components/pages/video/VideoList';
import VideoViewer from './components/pages/video/VideoViewer';
import CMS from './components/CMS';
import EdePage from './components/pages/ede/EdePage';
import JaraiPage from './components/pages/jarai/JaraiPage';
import MnongPage from './components/pages/mnong/MnongPage';
import EthnicImagesPage from './components/pages/EthnicImagesPage';
import NormalImageViewer from './components/pages/image/NormalImageViewer';
import PostView from './components/pages/PostView';
import AboutPage from './components/pages/about/AboutPage';
import SearchResult from './components/pages/SearchResult';
import YoutubePlayList from './components/pages/u2be/YoutubePlayList';
import YoutubeViewer from './components/pages/u2be/YoutubeViewer';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
      <Route path="/" element={<Home />} />

      {/* Danh sách model 3D */}
      <Route path="/3d" element={<ModelFileList />} />
      <Route path="/3d/:name" element={<Model3DViewer />} />
      <Route path="/3d/viewer" element={<Model3DViewer />} />

      {/* Danh sách ảnh 360 */}
      <Route path="/360" element={<ImageFileList />} />
      <Route path="/360/:name" element={<Image360Viewer />} />
      <Route path="/360/viewer" element={<Image360Viewer />} />

      {/* Normal image viewer */}
      <Route path="/image/viewer" element={<NormalImageViewer />} />

      {/* Danh sách video */}
      <Route path="/videos" element={<VideoList />} />
      <Route path="/videos/:name" element={<VideoViewer />} />

      {/* YouTube playlist */}
      <Route path="/u2be" element={<YoutubePlayList />} />
      <Route path="/u2be/:clipId" element={<YoutubeViewer />} />

      {/* Pages for categories */}
      <Route path="/ede" element={<EdePage />} />
      <Route path="/jarai" element={<JaraiPage />} />
      <Route path="/mnong" element={<MnongPage />} />

      {/* Ethnic Images page with tabs */}
      <Route path="/images" element={<EthnicImagesPage />} />

      {/* About page */}
      <Route path="/about" element={<AboutPage />} />

      {/* Post view */}
      <Route path="/post/:id" element={<PostView />} />

      {/* Search result view */}
      <Route path="/search" element={<SearchResult />} />

      {/* CMS routes */}
      <Route path="/cms/*" element={<CMS />} />
      </Routes>
    </ToastProvider>
  );
}
