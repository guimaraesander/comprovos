import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../src/pages/DashboardPage";

const mockListClients = vi.fn();
const mockListServiceOrders = vi.fn();

vi.mock("../src/services/clients", () => {
  return {
    listClients: () => mockListClients(),
  };
});

vi.mock("../src/services/serviceOrders", () => {
  return {
    listServiceOrders: () => mockListServiceOrders(),
  };
});

vi.mock("../src/components/PageHeader", () => {
  return {
    PageHeader: ({
      title,
      subtitle,
      actions,
    }: {
      title: string;
      subtitle?: string;
      actions?: React.ReactNode;
    }) => (
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        <div>{actions}</div>
      </div>
    ),
  };
});

vi.mock("../src/components/Card", () => {
  return {
    Card: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  };
});

vi.mock("../src/components/Table", () => {
  return {
    Table: ({ children }: { children: React.ReactNode }) => (
      <table>{children}</table>
    ),
  };
});

vi.mock("../src/components/Button", () => {
  return {
    Button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  };
});

vi.mock("../src/components/Alert", () => {
  return {
    AlertError: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    Muted: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <span className={className}>{children}</span>,
  };
});

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar o dashboard e exibir os elementos principais", async () => {
    mockListServiceOrders.mockResolvedValue([
      {
        id: "os-1",
        osNumber: 5,
        clientId: "client-1",
        clientCpfCnpj: "12345678910",
        equipmentType: "NOTEBOOK",
        symptoms: "Não liga",
        status: "EM_ANALISE",
        createdAt: "2026-03-13T20:36:00.000Z",
        client: {
          id: "client-1",
          name: "José Fábio",
        },
      },
      {
        id: "os-2",
        osNumber: 4,
        clientId: "client-2",
        clientCpfCnpj: "12345678911",
        equipmentType: "DESKTOP",
        symptoms: "Sem vídeo",
        status: "AGUARDANDO_APROVACAO",
        createdAt: "2026-03-13T19:26:00.000Z",
        client: {
          id: "client-2",
          name: "Maria Alves",
        },
      },
      {
        id: "os-3",
        osNumber: 3,
        clientId: "client-3",
        clientCpfCnpj: "12345678912",
        equipmentType: "IMPRESSORA",
        symptoms: "Falha de impressão",
        status: "ENTREGUE",
        createdAt: "2026-03-13T18:32:00.000Z",
        client: {
          id: "client-3",
          name: "Joao Alves",
        },
      },
    ]);

    mockListClients.mockResolvedValue([
      {
        id: "client-1",
        name: "José Fábio",
        phone: "88998034589",
        cpfCnpj: "12345678910",
        createdAt: "2026-03-10T10:00:00.000Z",
      },
      {
        id: "client-2",
        name: "Maria Alves",
        phone: "88998034588",
        cpfCnpj: "12345678911",
        createdAt: "2026-03-11T10:00:00.000Z",
      },
      {
        id: "client-3",
        name: "Joao Alves",
        phone: "88998034587",
        cpfCnpj: "12345678912",
        createdAt: "2026-03-12T10:00:00.000Z",
      },
    ]);

    render(<DashboardPage />);

    expect(screen.getAllByText(/carregando/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(mockListServiceOrders).toHaveBeenCalledTimes(1);
      expect(mockListClients).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole("heading", { name: /dashboard/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /atualizar/i })
    ).toBeInTheDocument();

    expect(screen.getAllByText(/josé fábio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/maria alves/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/joao alves/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/os #5/i)).toBeInTheDocument();
    expect(screen.getByText(/os #4/i)).toBeInTheDocument();
    expect(screen.getByText(/os #3/i)).toBeInTheDocument();
  });

  it("deve exibir mensagem de erro quando falhar ao carregar os dados", async () => {
    mockListServiceOrders.mockRejectedValue(new Error("Falha ao buscar ordens."));
    mockListClients.mockResolvedValue([]);

    render(<DashboardPage />);

    expect(
      await screen.findByText(/falha ao buscar ordens/i)
    ).toBeInTheDocument();
  });

  it("deve atualizar os dados ao clicar no botão atualizar", async () => {
    mockListServiceOrders
      .mockResolvedValueOnce([
        {
          id: "os-1",
          osNumber: 1,
          clientId: "client-1",
          clientCpfCnpj: "12345678910",
          equipmentType: "NOTEBOOK",
          symptoms: "Não liga",
          status: "ABERTA",
          createdAt: "2026-03-13T20:36:00.000Z",
          client: {
            id: "client-1",
            name: "José Fábio",
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "os-1",
          osNumber: 1,
          clientId: "client-1",
          clientCpfCnpj: "12345678910",
          equipmentType: "NOTEBOOK",
          symptoms: "Não liga",
          status: "ABERTA",
          createdAt: "2026-03-13T20:36:00.000Z",
          client: {
            id: "client-1",
            name: "José Fábio",
          },
        },
        {
          id: "os-2",
          osNumber: 2,
          clientId: "client-2",
          clientCpfCnpj: "12345678911",
          equipmentType: "DESKTOP",
          symptoms: "Sem vídeo",
          status: "ENTREGUE",
          createdAt: "2026-03-13T21:00:00.000Z",
          client: {
            id: "client-2",
            name: "Maria Alves",
          },
        },
      ]);

    mockListClients
      .mockResolvedValueOnce([
        {
          id: "client-1",
          name: "José Fábio",
          phone: "88998034589",
          cpfCnpj: "12345678910",
          createdAt: "2026-03-10T10:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "client-1",
          name: "José Fábio",
          phone: "88998034589",
          cpfCnpj: "12345678910",
          createdAt: "2026-03-10T10:00:00.000Z",
        },
        {
          id: "client-2",
          name: "Maria Alves",
          phone: "88998034588",
          cpfCnpj: "12345678911",
          createdAt: "2026-03-11T10:00:00.000Z",
        },
      ]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockListServiceOrders).toHaveBeenCalledTimes(1);
      expect(mockListClients).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /atualizar/i }));

    await waitFor(() => {
      expect(mockListServiceOrders).toHaveBeenCalledTimes(2);
      expect(mockListClients).toHaveBeenCalledTimes(2);
    });
  });
});