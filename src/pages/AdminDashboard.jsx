import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { Container, Row, Col, Table, Button, Form, Modal, InputGroup, Card, Nav, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('familias'); 
  const [familias, setFamilias] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [doacoes, setDoacoes] = useState([]); // Nova lista de doações
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notify, setNotify] = useState({ show: false, message: '', type: '' });
  const [form, setForm] = useState({ nome: '', dependentes: 0, renda: 0, totalEntregas: 0 });

  const showNotification = (message, type) => {
    setNotify({ show: true, message, type });
    setTimeout(() => setNotify({ show: false, message: '', type: '' }), 4000);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // Cores de contraste melhoradas
  const styles = {
    textPrimary: '#f8fafc', // Branco gelo (alto contraste)
    textSecondary: '#cbd5e1', // Cinza claro legível
    accent: '#38bdf8', // Azul neon
    cardBg: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(56, 189, 248, 0.2)'
  };

  useEffect(() => {
    setLoading(true);
    
    // 1. Escuta Famílias
    const qFam = query(collection(db, "familias"));
    const unsubFam = onSnapshot(qFam, (snap) => {
      setFamilias(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // 2. Escuta Solicitações
    const qSol = query(collection(db, "solicitacoes"), orderBy("data", "desc"));
    const unsubSol = onSnapshot(qSol, (snap) => {
      setSolicitacoes(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    // 3. Escuta Doações (Integração nova)
    const qDoa = query(collection(db, "doacoes"), orderBy("data", "desc"));
    const unsubDoa = onSnapshot(qDoa, (snap) => {
      setDoacoes(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });

    return () => { unsubFam(); unsubSol(); unsubDoa(); };
  }, []);

  // Lógica de Filtro
  const familiasFiltradas = familias.filter(f => 
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFamilias = [...familiasFiltradas].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
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
        ultimaAtualizacao: serverTimestamp()
      };
      if (editingId) {
        await updateDoc(doc(db, "familias", editingId), dataPayload);
        showNotification("Cadastro atualizado!", "success");
      } else {
        await addDoc(collection(db, "familias"), dataPayload);
        showNotification("Família cadastrada!", "success");
      }
      setShowModal(false);
    } catch (err) { showNotification("Erro ao salvar.", "danger"); }
  };

  const handleStatusUpdate = async (coll, id, novoStatus) => {
    try {
      await updateDoc(doc(db, coll, id), { status: novoStatus });
      showNotification("Status atualizado!", "success");
    } catch (err) { showNotification("Erro ao atualizar.", "danger"); }
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("Confirmar exclusão definitiva?")) {
      await deleteDoc(doc(db, coll, id));
      showNotification("Removido com sucesso.", "success");
    }
  };

  return (
    <div style={{ background: '#020617', minHeight: '100vh', color: styles.textPrimary, padding: '20px' }}>
      
      {/* Notificação Flutuante */}
      {notify.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
          background: '#0f172a', borderLeft: `5px solid ${notify.type === 'success' ? '#22c55e' : '#ef4444'}`,
          padding: '15px 25px', borderRadius: '8px', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>{notify.message}</div>
      )}

      <Container>
        <Row className="align-items-center mb-5 mt-4">
          <Col md={6}>
            <h1 style={{ fontWeight: 900, letterSpacing: '-1px' }}>
              ADMIN <span style={{ color: styles.accent, textShadow: `0 0 15px ${styles.accent}44` }}>DASHBOARD</span>
            </h1>
          </Col>
          <Col md={6} className="text-md-end">
            <Button variant="outline-light" className="me-3 border-0" onClick={handleLogout}>Sair</Button>
            <Button 
              style={{ background: `linear-gradient(135deg, ${styles.accent}, #818cf8)`, border: 'none', fontWeight: '800', padding: '10px 25px', borderRadius: '12px' }}
              onClick={() => { setEditingId(null); setForm({nome:'', dependentes:0, renda:0, totalEntregas:0}); setShowModal(true); }}
            >
              + NOVA FAMÍLIA
            </Button>
          </Col>
        </Row>

        <Nav variant="pills" className="mb-4 p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', width: 'fit-content' }}>
          <Nav.Item>
            <Nav.Link eventKey="familias" onClick={() => setActiveTab('familias')} 
              style={{ color: activeTab === 'familias' ? '#fff' : styles.textSecondary, background: activeTab === 'familias' ? styles.accent : 'transparent', fontWeight: 'bold' }}>
              👨‍👩‍👧 Famílias
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="solicitacoes" onClick={() => setActiveTab('solicitacoes')}
              style={{ color: activeTab === 'solicitacoes' ? '#fff' : styles.textSecondary, background: activeTab === 'solicitacoes' ? '#818cf8' : 'transparent', fontWeight: 'bold' }}>
              📩 Pedidos <Badge bg="danger" pill className="ms-1">{solicitacoes.filter(s => s.status === 'Pendente').length}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="doacoes" onClick={() => setActiveTab('doacoes')}
              style={{ color: activeTab === 'doacoes' ? '#fff' : styles.textSecondary, background: activeTab === 'doacoes' ? '#4ade80' : 'transparent', fontWeight: 'bold' }}>
              💰 Doações <Badge bg="info" pill className="ms-1">{doacoes.filter(d => d.status === 'Pendente').length}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="grow" variant="info" /></div>
        ) : (
          <>
            {/* ABA FAMÍLIAS */}
            {activeTab === 'familias' && (
              <>
                <InputGroup className="mb-4" style={{ maxWidth: '450px' }}>
                  <Form.Control 
                    placeholder="Pesquisar por nome do responsável..." 
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155', borderRadius: '12px' }}
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <div style={{ background: styles.cardBg, borderRadius: '20px', border: styles.border, overflow: 'hidden' }}>
                  <Table hover responsive variant="dark" className="m-0 border-0">
                    <thead>
                      <tr style={{ background: 'rgba(56, 189, 248, 0.15)', color: styles.accent }}>
                        <th className="p-3">Responsável</th>
                        <th className="p-3">Dependentes</th>
                        <th className="p-3">Renda Mensal</th>
                        <th className="p-3">Total Entregas</th>
                        <th className="p-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFamilias.map((f) => (
                        <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="p-3 fw-bold" style={{ color: styles.textPrimary }}>{f.nome}</td>
                          <td className="p-3" style={{ color: styles.textSecondary }}>{f.dependentes}</td>
                          <td className="p-3 text-success fw-bold">{Number(f.renda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="p-3">{f.totalEntregas}</td>
                          <td className="p-3 text-center">
                            <Button variant="link" className="text-info me-2" onClick={() => { setForm(f); setEditingId(f.id); setShowModal(true); }}>Editar</Button>
                            <Button variant="link" className="text-danger" onClick={() => handleDelete('familias', f.id)}>Excluir</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
            )}

            {/* ABA SOLICITAÇÕES */}
            {activeTab === 'solicitacoes' && (
              <Row>
                {solicitacoes.map((s) => (
                  <Col md={12} key={s.id} className="mb-3">
                    <Card style={{ background: styles.cardBg, border: styles.border, borderRadius: '15px' }}>
                      <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 style={{ color: styles.accent, fontWeight: 'bold' }}>{s.nomeFamilia}</h5>
                          <p style={{ color: styles.textSecondary, fontStyle: 'italic' }}>"{s.mensagem}"</p>
                          <small style={{ color: '#64748b' }}>Recebido em: {s.data?.toDate().toLocaleDateString()}</small>
                        </div>
                        <div className="d-flex gap-2">
                          <Badge bg={s.status === 'Pendente' ? 'warning' : 'success'} className="p-2 mb-2">{s.status}</Badge>
                          {s.status === 'Pendente' && (
                            <Button variant="success" size="sm" onClick={() => handleStatusUpdate('solicitacoes', s.id, "Resolvido")}>✓ Resolver</Button>
                          )}
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete('solicitacoes', s.id)}>Excluir</Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* ABA DOAÇÕES (NOVA) */}
            {activeTab === 'doacoes' && (
              <div style={{ background: styles.cardBg, borderRadius: '20px', border: styles.border, overflow: 'hidden' }}>
                <Table hover responsive variant="dark" className="m-0 border-0">
                  <thead>
                    <tr style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
                      <th className="p-3">Doador</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Método</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doacoes.map((d) => (
                      <tr key={d.id}>
                        <td className="p-3 fw-bold">{d.nome} <br/><small className="text-muted">{d.email}</small></td>
                        <td className="p-3 fw-bold text-success">R$ {d.valor}</td>
                        <td className="p-3">{d.metodo}</td>
                        <td className="p-3 text-secondary">{d.data?.toDate().toLocaleDateString()}</td>
                        <td className="p-3"><Badge bg={d.status === 'Pendente' ? 'warning' : 'success'}>{d.status}</Badge></td>
                        <td className="p-3 text-center">
                          {d.status === 'Pendente' && (
                            <Button variant="outline-success" size="sm" onClick={() => handleStatusUpdate('doacoes', d.id, "Confirmado")}>Confirmar</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </>
        )}
      </Container>

      {/* MODAL EDIÇÃO/CADASTRO */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="bg-dark text-white border-0" style={{ backdropFilter: 'blur(10px)' }}>
        <Modal.Header closeButton closeVariant="white" style={{ borderBottom: '1px solid #334155' }}>
          <Modal.Title style={{ fontWeight: 800 }}>{editingId ? 'EDITAR FAMÍLIA' : 'CADASTRAR FAMÍLIA'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-4">
              <Form.Label style={{ color: styles.accent, fontWeight: 'bold' }}>Nome do Responsável</Form.Label>
              <Form.Control required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} style={inputStyle} />
            </Form.Group>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Dependentes</Form.Label><Form.Control type="number" value={form.dependentes} onChange={e => setForm({...form, dependentes: e.target.value})} style={inputStyle} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Renda (R$)</Form.Label><Form.Control type="number" value={form.renda} onChange={e => setForm({...form, renda: e.target.value})} style={inputStyle} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Entregas</Form.Label><Form.Control type="number" value={form.totalEntregas} onChange={e => setForm({...form, totalEntregas: e.target.value})} style={inputStyle} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #334155' }}>
            <Button variant="outline-light" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" style={{ background: styles.accent, border: 'none', fontWeight: 'bold', padding: '10px 30px' }}>SALVAR DADOS</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

const inputStyle = {
  background: '#0f172a',
  color: 'white',
  border: '1px solid #334155',
  padding: '12px',
  borderRadius: '8px'
};

export default AdminDashboard;