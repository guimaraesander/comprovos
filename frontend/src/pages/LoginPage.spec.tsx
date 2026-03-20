/** @vitest-environment jsdom */
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import '@testing-library/jest-dom/vitest';

afterEach(cleanup);

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

    expect(screen.getByRole('heading', { name: /ComprovOS/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('deve permitir digitar no campo de email e senha', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/admin@comprovos.com/i);
    const passwordInput = screen.getByLabelText(/senha/i);

    // Simula a digitação usando fireEvent
    fireEvent.change(emailInput, { target: { value: 'atila@teste.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    expect(emailInput).toHaveValue('atila@teste.com');
    expect(passwordInput).toHaveValue('123456');
  });
});