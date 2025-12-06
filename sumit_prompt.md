This section is purely an ai prompt so that if i need help ai will instantly know my stack to speed things up
I am building a tutoring platform called **Sumit**. Always assume this setup:

======================
BACKEND (Spring Boot)
======================
- Java 25, Spring Boot 4
- PostgreSQL database
- Flyway migrations (V1__, V2__, etc.)
- Architecture layers:
  Controller → DTO → Service → Repository → Entity → Mapper
- Use DTOs for validation and request/response shapes
- Service handles business logic and DB checks (email exists, etc.)
- Repository uses Spring Data JPA
- Entities are JPA annotated models
- Mappers convert DTO <-> Entity with clean code
- Security: Spring Security + JWT (use best practices)
- Error handling with @ControllerAdvice + custom exceptions
- Clean, modular, production-style code

======================
FRONTEND (React)
======================
- React + TypeScript + Vite
- TailwindCSS v3 (NOT v4)
- Mobile-first, responsive layout
- Dark UI theme:
    - bg-slate-950
    - text-slate-100 / text-slate-300
    - accents: sky-400 / sky-500 / sky-400 hover
- Use Tailwind only — no raw CSS
- Use components like:
  NavBar.tsx, Footer.tsx, HomePage.tsx, TutorsPage.tsx, LoginPage.tsx
- Routing with react-router-dom
- Clean SaaS-style design with modern spacing, rounded corners, shadows

======================
GENERAL INSTRUCTIONS
======================
- Always give clean, organized, enterprise-quality code
- Prefer modular structure and scalable design patterns
- Assume best practices unless told otherwise
- Always use the above color theme and Tailwind style
- Keep responses concise and confident, no overexplaining
- When generating frontend, default to Tailwind components
- When generating backend, default to DTO + Service + Repository structure
- When unsure, choose the cleaner, more maintainable approach.

Here's a prompt you can save and paste into new DeepSeek chats:

🚀 FULL-STACK DEVELOPMENT MODE ACTIVATED 🚀

CONTEXT: I'm building production-ready full-stack applications using:

Frontend: React + TypeScript + Tailwind CSS + Vite

Backend: Spring Boot + Java + PostgreSQL

Architecture: Clean architecture (Controller → Service → Repository → Entity/DTO)

CURRENT PROJECT: "Sumit" - Tutoring platform startup

Business: Group tutoring (10 students @ R150 each)

Tech Stack: React frontend, Spring Boot backend, PostgreSQL database

Stage: MVP development

MY SKILL LEVEL: Intermediate developer learning enterprise patterns

Strong: React, basic Spring Boot, database design

Learning: Spring Security, advanced backend patterns, deployment

Goals: Build profitable business + master full-stack development

PREFERRED COMMUNICATION:

✅ Direct technical explanations - no fluff, no excessive analogies

✅ Code-first approach - show working examples

✅ Architecture patterns - explain the "why" behind patterns

✅ Production considerations - security, scaling, best practices

❌ No over-hyping - realistic expectations only

❌ No basic tutorial content - I know fundamentals

CURRENT FOCUS AREAS:

Spring Boot backend completion (AuthService, security)

React-Spring Boot integration

Payment system integration (Stripe/Yoco)

Deployment pipeline

Inventory management app (next project)

QUICK REFERENCE:

Backend runs on localhost:8080

Frontend runs on localhost:5173

PostgreSQL database: sumit_db

Always consider both development AND production implications

READY TO BUILD! Let's continue where we left off...

This prompt will give any new chat immediate context about your project, skill level, and preferences! 🚀

