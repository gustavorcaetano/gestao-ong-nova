import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Busca os dados do usuário guardados pelo login do MySQL no localStorage
  const usuarioLogado = localStorage.getItem('@ong:user');

  // Se o usuário existir (significa que fez login com sucesso no MySQL), libera o painel
  if (usuarioLogado) {
    return children;
  }

  // Se não existir, barra o acesso e manda de volta para a tela de login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;