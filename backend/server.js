const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Permite que o Node entenda dados em formato JSON

// 🗄️ 1. Conexão com o Banco de Dados (Pode usar o MySQL do MAMP!)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', // Senha padrão do MAMP é root
    database: 'nome_do_seu_banco', // Substitua pelo nome do banco criado no phpMyAdmin
    port: 8889 // Porta padrão do MySQL no MAMP
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL do MAMP:', err);
    } else {
        console.log('Conectado com sucesso ao Banco de Dados do MAMP! 🚀');
    }
});

// 🌐 2. Suas Rotas da Raiz (Substituindo o index.php)
// Em vez de index.php?uri=home, o React vai disparar requisições para cá:

app.get('/api/home', (req, res) => {
    res.json({ mensagem: "Bem-vindo à API da ONG! Dados da Home carregados." });
});

app.get('/api/projetos', (req, res) => {
    // Exemplo de busca no banco de dados
    db.query('SELECT * FROM projetos', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 🏃‍♂️ 3. Ligando o Servidor Node
const PORT = 3001; // O Node roda em uma porta diferente do React (5173) e do MAMP (8888)
app.listen(PORT, () => {
    console.log(`Servidor do Back-end rodando em http://localhost:${PORT}`);
});