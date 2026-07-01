<?php
// app/controllers/DoacaoController.php

// Define que o retorno desta rota será um JSON de API
header('Content-Type: application/json');

// Recebe os dados JSON vindos do React Fetch
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($input)) {
    try {
        // Puxa as configurações globais do banco do seu professor
        // Caso as variáveis globais não estejam carregadas, você pode instanciar o PDO diretamente aqui
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $stmt = $pdo->prepare("INSERT INTO doacoes (nome, email, valor, metodo, status) VALUES (:nome, :email, :valor, :metodo, :status)");
        
        $stmt->execute([
            ':nome'   => $input['nome'],
            ':email'  => $input['email'] ?? '',
            ':valor'  => $input['valor'],
            ':metodo' => $input['metodo'],
            ':status' => $input['status'] ?? 'Pendente'
        ]);

        echo json_encode(["status" => "sucesso", "mensagem" => "Doação salva com sucesso!"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "erro", "mensagem" => $e->getMessage()]);
    }
    exit;
} else {
    http_response_code(400);
    echo json_encode(["status" => "erro", "mensagem" => "Requisição inválida."]);
    exit;
}