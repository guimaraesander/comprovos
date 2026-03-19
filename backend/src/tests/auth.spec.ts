import { it, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Autenticação', () => {
  it('não deve logar com credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'usuario.inexistente@teste.com',
        password: 'senha-errada'
      });
    
    expect(response.status).toBe(401); 
  });
});

it('deve logar com sucesso com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@comprovos.com', 
        password: '123456'            
      });
    
    expect(response.status).toBe(200);
    
    expect(response.body).toHaveProperty('token');
    console.log('Token recebido:', response.body.token);
  });