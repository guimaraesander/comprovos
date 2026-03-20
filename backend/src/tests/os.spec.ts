import { it, expect, describe, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('CRUD de Ordens de Serviço', () => {
  let token: string;
  let clientId: string;
  let clientCpfCnpj: string = "123.456.789-00";

  beforeAll(async () => {
    // 1. LOGIN
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@comprovos.com', password: '123456' });
    token = authResponse.body.token;

    // 2. CRIAR UM CLIENTE REAL (Para garantir que o ID exista)
    const clientResponse = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Cliente de Teste Automatizado",
        email: `teste-${Date.now()}@exemplo.com`,
        cpfCnpj: clientCpfCnpj,
        phone: "11999999999"
      });

    if (clientResponse.status !== 201) {
      console.log('🚨 ERRO AO CRIAR CLIENTE:', clientResponse.body);
    }

    clientId = clientResponse.body.id; // Pegar o ID real do banco
  });

  it('deve criar uma nova Ordem de Serviço com sucesso', async () => {
    const response = await request(app)
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: clientId, // USANDO O ID QUE ACABAMOS DE CRIAR
        clientCpfCnpj: clientCpfCnpj,
        equipmentType: "Servidor Dell R740",
        symptoms: "Configuração de RAID e instalação de SO"
      });

    if (response.status !== 201) {
      console.log('🚨 ERRO NA OS:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});