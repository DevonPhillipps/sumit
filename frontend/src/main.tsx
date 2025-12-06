import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SignUp from './SignUp.tsx'
import Login from './Login.tsx'
import BecomeTutorPage from "./BecomeTutorPage";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/become-tutor" element={<BecomeTutorPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)