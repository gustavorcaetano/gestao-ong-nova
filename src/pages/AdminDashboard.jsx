import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { Container, Row, Col, Table, Button, Form, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [familias, setFamilias] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para a busca
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' }); // Estado para ordenação
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notify, setNotify] = useState({ show: false, message: '', type: '' });
  const [form, setForm] = useState({ nome: '', dependentes: 0, renda: 0, totalEntregas: 0 });

  const showNotification = (message, type) => {
    setNotify({ show: true, message, type });
    setTimeout(() => setNotify({ show: false, message: '', type: '' }), 4000);
  };

  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "familias"));
    setFamilias(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => { fetchData(); }, []);

  // LÓGICA DE BUSCA: Filtra pelo nome conforme o usuário digita
  const familiasFiltradas = familias.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LÓGICA DE ORDENAÇÃO: Menor para maior e vice-versa
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedFamilias = [...familiasFiltradas].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataPayload = {
        ...form,
        dependentes: Number(form.dependentes),
        renda: Number(form.renda),
        totalEntregas: Number(form.totalEntregas),
        ultimaEntrega: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "familias", editingId), dataPayload);
        showNotification("Cadastro atualizado!", "success");
      } else {
        await addDoc(collection(db, "familias"), dataPayload);
        showNotification("Família cadastrada!", "success");
      }
      
      setForm({ nome: '', dependentes: 0, renda: 0, totalEntregas: 0 });
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (err) {
      showNotification("Erro ao salvar.", "danger");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Excluir registro?")) {
      await deleteDoc(doc(db, "familias", id));
      showNotification("Registro removido.", "success");
      fetchData();
    }
  };

  return (
    <div style={{ background: '#05070a', minHeight: '100vh', color: 'white', padding: '20px' }}>
      
      {notify.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)',
          border: `1px solid ${notify.type === 'success' ? '#38bdf8' : '#ff4d4d'}`,
          padding: '15px 25px', borderRadius: '12px', color: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)', animation: 'slideIn 0.5s ease'
        }}>
          {notify.type === 'success' ? '💙 ' : '⚠️ '} {notify.message}
        </div>
      )}

      <Container>
        <Row className="align-items-center mb-4 mt-4">
          <Col xs={12} md={6}>
            <Button variant="link" onClick={() => navigate('/')} style={{ color: '#38bdf8', textDecoration: 'none', padding: 0 }}>
              ← Início
            </Button>
            <h1 style={{ fontWeight: 800 }}>Gestão de Famílias</h1>
          </Col>
          <Col xs={12} md={6} className="text-md-end">
            <Button 
              style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold' }}
              onClick={() => { setEditingId(null); setForm({nome:'', dependentes:0, renda:0, totalEntregas:0}); setShowModal(true); }}
            >
              + Nova Família
            </Button>
          </Col>
        </Row>

        {/* CAMPO DE BUSCA */}
        <Row className="mb-4">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text style={{ background: '#111', border: '1px solid #333', color: '#38bdf8' }}>🔍</InputGroup.Text>
              <Form.Control 
                placeholder="Buscar família pelo nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: '#111', border: '1px solid #333', color: 'white' }}
              />
            </InputGroup>
          </Col>
        </Row>

        {/* TABELA COM ORDENAÇÃO NOS CABEÇALHOS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <Table variant="dark" hover className="m-0">
              <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th onClick={() => requestSort('nome')} style={{ cursor: 'pointer' }}>Responsável {sortConfig.key === 'nome' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('dependentes')} style={{ cursor: 'pointer' }}>Dep. {sortConfig.key === 'dependentes' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('renda')} style={{ cursor: 'pointer' }}>Renda {sortConfig.key === 'renda' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('totalEntregas')} style={{ cursor: 'pointer' }}>Entregas {sortConfig.key === 'totalEntregas' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedFamilias.map((f) => (
                  <tr key={f.id}>
                    <td>{f.nome}</td>
                    <td>{f.dependentes}</td>
                    <td>{f.renda?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>{f.totalEntregas}</td>
                    <td>
                      <Button variant="link" onClick={() => { setForm(f); setEditingId(f.id); setShowModal(true); }}>✏️</Button>
                      <Button variant="link" className="text-danger" onClick={() => handleDelete(f.id)}>🗑️</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </Container>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="bg-dark text-white border-0 shadow-lg">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{editingId ? 'Editar' : 'Cadastrar'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Responsável</Form.Label>
              <Form.Control required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Row>
              <Form.Label>Dependentes</Form.Label>
              <Col><Form.Control type="number" placeholder="Dep." value={form.dependentes} onChange={e => setForm({...form, dependentes: e.target.value})} className="bg-dark text-white border-secondary" /></Col>
              <Form.Label>Renda Mensal</Form.Label>
              <Col><Form.Control type="number" placeholder="Renda" value={form.renda} onChange={e => setForm({...form, renda: e.target.value})} className="bg-dark text-white border-secondary" /></Col>
              <Form.Label>Total de Entregas</Form.Label>
              <Col><Form.Control type="number" placeholder="Entregas" value={form.totalEntregas} onChange={e => setForm({...form, totalEntregas: e.target.value})} className="bg-dark text-white border-secondary" /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-light" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" style={{ background: '#38bdf8', border: 'none' }}>Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;