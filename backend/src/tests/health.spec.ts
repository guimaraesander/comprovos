import { it, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('API Health Check', () => {
  it('deve retornar 200 na rota de health', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});