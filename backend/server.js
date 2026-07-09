const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Permite que o Node entenda dados em formato JSON

// 🗄️ 1. Conexão com o Banco de Dados no Docker
const db = mysql.createConnection({
  host: '127.0.0.1',       // Endereço local para o Docker
  user: 'root',
  password: 'root',        // Senha definida no contêiner do Docker
  database: 'gestao_ong',  // Banco criado automaticamente pelo Docker
  port: 3306               // Porta padrão universal do MySQL
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL no Docker:', err);
    } else {
        console.log('Conectado com sucesso ao Banco de Dados no Docker! 🚀');
    }
});

// 🌐 2. Rotas da API

// Rota de teste da Home
app.get('/api/home', (req, res) => {
    res.json({ mensagem: "Bem-vindo à API da ONG! Dados da Home carregados." });
});

// Rota para RECEBER doações do Front-end (Axios)
app.post('/api/doacoes', (req, res) => {
  const { nome, email, valor, metodo } = req.body;

  const query = 'INSERT INTO doacoes (nome, email, valor, metodo, status) VALUES (?, ?, ?, ?, ?)';
  const values = [nome, email, valor, metodo, 'Pendente'];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Erro ao inserir no MySQL:", err);
      return res.status(500).json({ erro: "Erro ao salvar no banco de dados" });
    }
    res.status(201).json({ 
      mensagem: "Doação registrada com sucesso no MySQL do Docker!", 
      idDoacao: result.insertId 
    });
  });
});

// Rota para o AdminDashboard LISTAR todas as doações salvas
app.get('/api/admin/doacoes', (req, res) => {
  const query = 'SELECT * FROM doacoes ORDER BY data DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Erro ao buscar doações:", err);
      return res.status(500).json({ erro: "Erro ao buscar dados do banco" });
    }
    res.json(results); // Envia a lista de doações em formato JSON para o React
  });
});

// Rota para ATUALIZAR o status de uma doação para 'Confirmado'
app.put('/api/admin/doacoes/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const query = 'UPDATE doacoes SET status = ? WHERE id = ?';
  
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar status no MySQL:", err);
      return res.status(500).json({ erro: "Erro ao atualizar doação no banco" });
    }
    res.json({ mensagem: "Status da doação atualizado com sucesso!" });
  });
});

// 🏃‍♂️ 3. Ligando o Servidor Node
const PORT = 3001; 
app.listen(PORT, () => {
    console.log(`Servidor do Back-end rodando em http://localhost:${PORT}`);
});