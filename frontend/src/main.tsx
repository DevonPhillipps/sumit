import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App";
import SignUp from "./SignUp";
import Login from "./Login";
import BecomeTutorPage from "./BecomeTutorPage";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard from "./AdminDashboard";
import TutorDashboard from "./TutorDashboard";

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                {/* Public / landing */}
                <Route path="/" element={<App />} />

                {/* Auth */}
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />

                {/* Public flow */}
                <Route path="/become-tutor" element={<BecomeTutorPage />} />

                {/* Dashboards */}
                <Route path="/dashboard/student" element={<StudentDashboard />} />
                <Route path="/dashboard/tutor" element={<TutorDashboard />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
