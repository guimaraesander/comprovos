/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import '@testing-library/jest-dom/vitest';

// 🛡️ Simula o localStorage para o teste não quebrar no AuthContext
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

describe('LoginPage', () => {
  it('deve renderizar o título do sistema e os campos de login', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // ✅ Agora procuramos especificamente pelo TÍTULO (h1) para não confundir com o rodapé
    expect(screen.getByRole('heading', { name: /ComprovOS/i })).toBeInTheDocument();
    
    // ✅ Validações dos outros campos
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });
});