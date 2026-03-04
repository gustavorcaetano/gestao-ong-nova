import React, { useEffect, useRef, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Importações do Three.js para o fundo de estrelas
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

gsap.registerPlugin(ScrollTrigger);

// --- 1. FUNDO 3D DE ESTRELAS (Three.js) ---
function StarField() {
  const ref = useRef();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    // Rotação lenta e contínua
    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
    // Paralaxe sutil com o movimento do mouse
    ref.current.rotation.x += (state.mouse.y * 0.2 - ref.current.rotation.x) * 0.1;
    ref.current.rotation.y += (state.mouse.x * 0.2 - ref.current.rotation.y) * 0.1;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#38bdf8"
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

// --- 2. COMPONENTE PRINCIPAL ---
const LandingPage = () => {
  const navigate = useNavigate();
  const mainRef = useRef(null);

  // --- FUNÇÕES DE HOVER PARA O BOTÃO PRINCIPAL (Glow effect) ---
  const onButtonEnter = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1.05,
      boxShadow: '0 0 35px rgba(56, 189, 248, 0.6)',
      filter: 'brightness(1.2)',
      duration: 0.3
    });
  };

  const onButtonLeave = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      boxShadow: '0 10px 25px rgba(56, 189, 248, 0.3)',
      filter: 'brightness(1)',
      duration: 0.3
    });
  };

  // --- FUNÇÕES DE HOVER PARA AS BOLHAS (Z-index e Glow) ---
  const onBubbleEnter = (e, color) => {
    const target = e.currentTarget;
    const img = target.querySelector('img');
    const label = target.querySelector('.bubble-label');

    // Traz para frente e aumenta o brilho
    gsap.to(target, {
      scale: 1.15,
      boxShadow: `0 0 50px ${color}, inset 0 0 20px ${color}`,
      borderColor: color,
      zIndex: 100, // Garante que fique por cima das outras
      duration: 0.5,
      ease: "back.out(1.7)"
    });

    gsap.to(img, { opacity: 1, mixBlendMode: 'normal', scale: 1.1, duration: 0.5 });
    gsap.to(label, { y: -10, opacity: 1, color: '#fff', textShadow: `0 0 15px ${color}`, duration: 0.4 });
  };

  const onBubbleLeave = (e, color) => {
    const target = e.currentTarget;
    const img = target.querySelector('img');
    const label = target.querySelector('.bubble-label');

    // Volta ao estado normal suavemente
    gsap.to(target, {
      scale: 1,
      boxShadow: `0 0 20px ${color}cc, inset 0 0 15px ${color}aa`,
      borderColor: `${color}66`,
      zIndex: 5, // Volta para o z-index base
      duration: 0.5,
      ease: "power2.inOut"
    });

    gsap.to(img, { opacity: 0.6, mixBlendMode: 'luminosity', scale: 1, duration: 0.5 });
    gsap.to(label, { y: 0, color: color, textShadow: `0 0 10px ${color}`, duration: 0.4 });
  };

  // --- NOVAS FUNÇÕES DE HOVER PARA OS CARDS (Preenchimento Gradiente) ---
  const onCardEnter = (e) => {
    const card = e.currentTarget;
    const icon = card.querySelector('.card-icon');
    const title = card.querySelector('.card-title');
    const desc = card.querySelector('.card-desc');

    const tl = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.out" } });

    tl.to(card, {
      // Gradiente similar ao botão
      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.9) 0%, rgba(129, 140, 248, 0.9) 100%)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      y: -10, // Leve levantamento
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    })
    .to(icon, { scale: 1.2, y: -5, filter: 'brightness(0) invert(1)' }, 0) // Ícone fica branco e sobe
    .to(title, { color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }, 0) // Título branco
    .to(desc, { color: 'rgba(255, 255, 255, 0.8)' }, 0); // Descrição quase branca
  };

  const onCardLeave = (e) => {
    const card = e.currentTarget;
    const icon = card.querySelector('.card-icon');
    const title = card.querySelector('.card-title');
    const desc = card.querySelector('.card-desc');

    const tl = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.inOut" } });

    tl.to(card, {
      // Volta para o estado transparente original
      background: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'rgba(56, 189, 248, 0.1)',
      y: 0,
      boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
    })
    .to(icon, { scale: 1, y: 0, filter: 'brightness(1) invert(0)' }, 0)
    .to(title, { color: '#38bdf8', textShadow: 'none' }, 0) // Volta para o azul
    .to(desc, { color: '#94a3b8' }, 0); // Volta para o cinza
  };

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. Entrada Animada do Hero
      gsap.from(".hero-content", { opacity: 0, y: 50, duration: 1.5, ease: "expo.out", delay: 0.3 });

      // 2. ANIMAÇÃO DE ÓRBITA DAS BOLHAS (Corrigida para não empilhar)
      const bubbleSelectors = [".bubble-1", ".bubble-2", ".bubble-3", ".bubble-4"];
      bubbleSelectors.forEach((sel, i) => {
        // Espalha as bolhas no círculo (0, 90, 180, 270 graus)
        const startAngle = (i / bubbleSelectors.length) * Math.PI * 2;
        const radius = 180; // Raio da órbita

        gsap.to(sel, {
          duration: 20, // Velocidade da rotação lenta
          repeat: -1,
          ease: "none",
          onUpdate: function() {
            const time = this.progress() * Math.PI * 2 + startAngle;
            const x = Math.cos(time) * radius;
            const y = Math.sin(time) * radius;
            gsap.set(sel, { x: x, y: y });
          }
        });
        
        // Flutuação orgânica individual
        gsap.to(sel, {
          yPercent: "random(-15, 15)",
          xPercent: "random(-10, 10)",
          duration: "random(2, 4)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

      // 3. Scroll Animation para os Cards (aparecem de baixo)
      gsap.from(".feedback-card", {
        scrollTrigger: { trigger: ".feedback-section", start: "top 85%" },
        y: 80, opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.2, ease: "power2.out"
      });

    }, mainRef);

    return () => ctx.revert();
  }, []);

  const bubblesData = [
    { id: "bubble-1", color: "#38bdf8", img: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=400", label: "Acolhimento" },
    { id: "bubble-2", color: "#818cf8", img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400", label: "Educação" },
    { id: "bubble-3", color: "#22d3ee", img: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400", label: "União" },
    { id: "bubble-4", color: "#a78bfa", img: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400", label: "Amor" }
  ];

  return (
    <div ref={mainRef} style={{ background: '#05070a', color: 'white', overflowX: 'hidden' }}>
      
      {/* SEÇÃO HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '0 8%', position: 'relative' }}>
        
        {/* Fundo Three.js (Atrás de tudo) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
          <Canvas camera={{ position: [0, 0, 1] }}>
            <Suspense fallback={null}><StarField /></Suspense>
          </Canvas>
        </div>

        {/* Texto Hero */}
        <div className="hero-content" style={{ flex: 1, zIndex: 10, position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: '900', lineHeight: 1.1, marginBottom: '25px', letterSpacing: '-2px' }}>
            GESTÃO SOCIAL<br/><span style={{ color: '#38bdf8', textShadow: '0 0 30px rgba(56,189,248,0.3)' }}>INTELIGENTE</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '480px', marginBottom: '45px', lineHeight: '1.6' }}>
            Transformando a realidade de famílias através de transparência e tecnologia humanizada.
          </p>
          <button 
            onClick={() => navigate('/login')}
            onMouseEnter={onButtonEnter}
            onMouseLeave={onButtonLeave}
            style={{ 
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', 
              border: 'none', padding: '20px 50px', borderRadius: '50px', 
              color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '1.1rem',
              boxShadow: '0 10px 25px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}>
            COMEÇAR AGORA
          </button>
        </div>

        {/* CONTAINER DE ÓRBITA DAS BOLHAS (Centralizado no lado direito) */}
        <div style={{ flex: 1, position: 'relative', height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
          {bubblesData.map((b, i) => (
            <div 
              key={i} 
              className={b.id}
              onMouseEnter={(e) => onBubbleEnter(e, b.color)}
              onMouseLeave={(e) => onBubbleLeave(e, b.color)}
              style={{
                width: '200px', height: '200px', // Tamanho base
                borderRadius: '50%', overflow: 'hidden',
                position: 'absolute', cursor: 'pointer',
                border: `2px solid ${b.color}66`,
                boxShadow: `0 0 20px ${b.color}cc, inset 0 0 15px ${b.color}aa`,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                zIndex: 5, // Z-index base
                // Importante: Centralizar a bolha antes do GSAP mover
                transform: 'translate(-50%, -50%)' 
              }}>
              <img src={b.img} alt={b.label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, mixBlendMode: 'luminosity' }} />
              <div className="bubble-label" style={{ 
                position: 'absolute', bottom: '25px', width: '100%', textAlign: 'center', 
                fontSize: '0.85rem', fontWeight: '900', color: b.color, textShadow: `0 0 10px ${b.color}`,
                textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none'
              }}>
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO DE IMPACTO (Cards) */}
      <section className="feedback-section" style={{ padding: '120px 8%', backgroundColor: '#080a0f', position: 'relative', zIndex: 10 }}>
        <h2 style={{ fontSize: '2.8rem', fontWeight: '800', textAlign: 'center', marginBottom: '80px', color: '#f8fafc' }}>
          Impacto em Tempo Real
        </h2>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { title: "1.2k", desc: "Famílias Auxiliadas", icon: "🏠" },
            { title: "15t", desc: "Alimentos Distribuídos", icon: "🍎" },
            { title: "100%", desc: "Transparência Total", icon: "✅" }
          ].map((item, i) => (
            <div 
              key={i} 
              className="feedback-card"
              onMouseEnter={onCardEnter} // Ativa o hover avançado
              onMouseLeave={onCardLeave} // Desativa o hover avançado
              style={{
                background: 'rgba(255, 255, 255, 0.02)', // Estado original transparente
                padding: '50px 40px', 
                borderRadius: '28px',
                width: '320px', 
                border: '1px solid rgba(56, 189, 248, 0.1)', 
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease, transform 0.3s ease', // Transições suaves base
                position: 'relative',
                overflow: 'hidden'
              }}>
              {/* Classes card-icon, card-title e card-desc são usadas pelo GSAP */}
              <div className="card-icon" style={{ fontSize: '3.5rem', marginBottom: '25px', transition: 'all 0.4s ease' }}>
                {item.icon}
              </div>
              <h3 className="card-title" style={{ color: '#38bdf8', fontWeight: '900', fontSize: '2.3rem', marginBottom: '10px', transition: 'all 0.4s ease' }}>
                {item.title}
              </h3>
              <p className="card-desc" style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.5', margin: 0, transition: 'all 0.4s ease' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Estilo para a animação slideIn (usada internamente se necessário) */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LandingPage;