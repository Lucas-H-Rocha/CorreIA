/* ============================================================ */
/* SISTEMA GLOBAL DE NOTIFICAÇÕES (TOASTS)                      */
/* ============================================================ */

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // 1. Verifica se o contentor de toasts já existe no HTML. Se não, cria-o dinamicamente.
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 2. Cria o elemento da notificação
    const toast = document.createElement('div');
    toast.className = `toast-mensagem toast-${tipo}`;
    
    // 3. Define o ícone com base no tipo de feedback
    const icone = tipo === 'erro' ? '❌' : '✅';
    toast.innerHTML = `<span>${icone}</span> <span>${mensagem}</span>`;

    // 4. Adiciona ao contentor na interface
    container.appendChild(toast);

    // 5. Gatilho de animação: Um pequeno atraso é necessário para o CSS processar a transição
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 6. Autodestruição: Remove o toast após 3.5 segundos para não poluir o DOM
    setTimeout(() => {
        toast.classList.remove('show');
        // Aguarda a animação de saída terminar antes de remover do HTML
        setTimeout(() => toast.remove(), 400); 
    }, 3500);
}

/* ============================================================ */
/* 1. GESTÃO DE SESSÃO E NAVEGAÇÃO                              */
/* ============================================================ */

function gerenciarSessao() {
    const usuario = localStorage.getItem('usuarioLogado');
    const path = window.location.pathname;

    const paginasPublicas = ['index.html', 'login.html', 'cadastro.html', '/'];
    const ehPaginaPublica = paginasPublicas.some(p => path.includes(p));

    if (!usuario && !ehPaginaPublica) {
        window.location.href = 'login.html';
        return;
    }

    const nomePerfilDisplay = document.getElementById('nome-perfil-display');
    if (nomePerfilDisplay) {
        nomePerfilDisplay.innerText = usuario;
    }

    const boasVindas = document.getElementById('boas-vindas');
    if (boasVindas && usuario) {
        const primeiroNome = usuario.split(' ')[0]; 
        boasVindas.innerText = `Bem-vindo, ${primeiroNome}!`;
    }

    const btnSair = document.getElementById('btn-logout');
    if (btnSair) {
        btnSair.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
}

/* ============================================================ */
/* 2. SIMULADOR DA HOME (INDEX.HTML)                            */
/* ============================================================ */

function inicializarSimuladorHome() {
    const btn = document.getElementById('btn-calcular-home');
    if (!btn) return;

    btn.onclick = () => {
        const pace = parseFloat(document.getElementById('input-pace').value);
        const dist = parseFloat(document.getElementById('select-distancia').value);
        const res = document.getElementById('resultado-calculo-home');

        if (pace > 0 && dist > 0) {
            let totalMin = pace * dist;
            const h = Math.floor(totalMin / 60);
            const m = Math.floor(totalMin % 60);
            const s = Math.round((totalMin % 1) * 60);
            
            res.innerHTML = `
                <div class="resultado-box-pro" style="margin-top: 1.5rem; background: var(--white); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--radius-md);">
                    <p class="label-resultado" style="font-size: 0.8rem; color: var(--text-secondary); font-weight: bold; margin-bottom: 0.5rem;">TEMPO ESTIMADO</p>
                    <h2 class="valor-resultado" style="color: var(--primary-blue); font-size: 2.5rem;">${h > 0 ? h + 'h ' : ''}${m}min ${s}s</h2>
                </div>
            `;
        }
    };
}

/* ============================================================ */
/* 3. AUTENTICAÇÃO E CADASTRO                                   */
/* ============================================================ */

async function lidarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const res = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        
        if (data.sucesso) {
            localStorage.setItem('usuarioLogado', data.nome);
            localStorage.setItem('usuarioId', data.id);
            localStorage.setItem('tipoUsuario', data.tipo);
            
            mostrarNotificacao(`Bem-vindo de volta, ${data.nome}!`, 'sucesso');
            
            // Atraso de 1 segundo para o utilizador ler a notificação antes do redirecionamento
            setTimeout(() => {
                if (data.tipo === 'admin') {
                    window.location.href = 'admin.html'; 
                } else {
                    window.location.href = 'dashboard.html'; 
                }
            }, 1000);
            
        } else {
            mostrarNotificacao(data.mensagem, 'erro');
        }
    } catch (err) {
        mostrarNotificacao("Erro de conexão com o servidor. Tente novamente.", 'erro');
    }
}

async function lidarCadastro(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const distancia_alvo = document.getElementById('distancia-alvo').value;
    const peso = document.getElementById('peso').value;
    const pace = document.getElementById('pace-cadastro').value;

    const frequenciaInput = document.getElementById('frequencia');
    const frequencia = frequenciaInput ? frequenciaInput.value : 3;

    if (senha !== confirmarSenha) {
        mostrarNotificacao("As palavras-passe não coincidem!", 'erro');
        return;
    }

    const dadosCadastro = { nome, email, senha, distancia_alvo, peso, frequencia, pace };

    try {
        const res = await fetch('http://127.0.0.1:5000/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCadastro)
        });
        const data = await res.json();
        
        if (data.sucesso) {
            localStorage.setItem('usuarioLogado', data.nome);
            localStorage.setItem('usuarioId', data.id);
            localStorage.setItem('tipoUsuario', data.tipo);
            
            mostrarNotificacao(`Conta criada com sucesso! Preparando o seu painel...`, 'sucesso');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            mostrarNotificacao("Atenção: " + data.mensagem, 'erro');
        }
    } catch (err) {
        mostrarNotificacao("Erro ao tentar criar a conta. Verifique a conexão.", 'erro');
    }
}

/* ============================================================ */
/* 4. DASHBOARD E REGISTO DE TREINOS                            */
/* ============================================================ */

async function carregarHistorico() {
    const userId = localStorage.getItem('usuarioId');
    const tipo = localStorage.getItem('tipoUsuario');
    if (!userId) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/historico?usuario_id=${userId}&tipo=${tipo}`);
        const treinos = await res.json();

        const tituloDashboard = document.getElementById('treino-titulo');
        const metaDashboard = document.getElementById('treino-meta');
        
        if (tituloDashboard && metaDashboard) {
            if (treinos.length > 0) {
                const ultimoTreino = treinos[0]; 
                tituloDashboard.innerText = `Foco IA: ${ultimoTreino.distancia_alvo.toUpperCase()}`;
                metaDashboard.innerText = ultimoTreino.sugestao;
            } else {
                tituloDashboard.innerText = "Bem-vindo ao CorreAI";
                metaDashboard.innerText = "A nossa IA está pronta para criar o teu plano.";
            }
        }

        const listaRegistro = document.getElementById('lista-treinos-detalhada');
        const totalTreinos = document.getElementById('total-treinos');

        if (listaRegistro && totalTreinos) {
            totalTreinos.innerText = treinos.length;

            if (treinos.length === 0) {
                listaRegistro.innerHTML = '<p class="status-carregamento">Nenhum treino registado. A tua jornada começa aqui!</p>';
                return;
            }

            listaRegistro.innerHTML = treinos.map(t => {
                const dataFormatada = new Date(t.data).toLocaleDateString('pt-PT');
                return `
                <div class="treino-item">
                    <div>
                        <p class="label-detalhe">Data</p>
                        <p class="valor-detalhe">${dataFormatada}</p>
                    </div>
                    <div>
                        <p class="label-detalhe">Objetivo</p>
                        <p class="valor-detalhe">${t.distancia_alvo.toUpperCase()}</p>
                    </div>
                    <div>
                        <p class="label-detalhe">Pace Base</p>
                        <p class="valor-detalhe">${t.pace}</p>
                    </div>
                    <div style="grid-column: span 2;">
                        <p class="label-detalhe">Plano de Treino IA</p>
                        <p class="valor-detalhe" style="color: var(--primary-blue); font-weight: 800;">${t.sugestao}</p>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-icon icon-sucesso" style="background: var(--success-green); color: white; padding: 0.5rem; border-radius: 50%;">✔️</span>
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function lidarRegistroTreino(e) {
    e.preventDefault();
    const form = e.target;
    
    const data = form.querySelector('input[type="date"]').value;
    const distancia = form.querySelector('input[type="number"]').value;
    const tempo = form.querySelector('input[type="time"]').value;
    const rota = document.getElementById('input-rota').value;
    const usuario_id = localStorage.getItem('usuarioId');

    if (!usuario_id) {
        mostrarNotificacao("Erro: Utilizador não identificado.", 'erro');
        return;
    }

    try {
        const res = await fetch('http://127.0.0.1:5000/registrar_corrida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id, data, distancia, tempo, rota })
        });
        
        const resposta = await res.json();
        
        if (resposta.sucesso) {
            mostrarNotificacao("Treino registado com sucesso! 🏃‍♂️💨", 'sucesso');
            form.reset(); 
            carregarProgressoMensal(); // Atualiza a barra lateral imediatamente
        } else {
            mostrarNotificacao("Erro ao registar: " + resposta.mensagem, 'erro');
        }
    } catch (err) {
        mostrarNotificacao("Erro ao conectar com o servidor.", 'erro');
    }
}

/* ============================================================ */
/* 5. PERFIL E PROGRESSO MENSAL (CONTA)                         */
/* ============================================================ */

async function carregarPerfil() {
    const userId = localStorage.getItem('usuarioId');
    if (!userId || !window.location.pathname.includes('conta.html')) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/perfil?usuario_id=${userId}`);
        const dados = await res.json();

        if (!dados.erro) {
            document.getElementById('perfil-nome').value = dados.nome || '';
            document.getElementById('perfil-email').value = dados.email || '';
            document.getElementById('perfil-idade').value = dados.idade || '';
            document.getElementById('perfil-peso').value = dados.peso_inicial || '';
            
            const inputMeta = document.getElementById('perfil-meta');
            if (inputMeta) inputMeta.value = dados.meta_mensal || 100;
        }
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
    }
}

async function lidarAtualizacaoPerfil(e) {
    e.preventDefault();
    
    const usuario_id = localStorage.getItem('usuarioId');
    const nome = document.getElementById('perfil-nome').value;
    const email = document.getElementById('perfil-email').value;
    const idade = document.getElementById('perfil-idade').value;
    const peso = document.getElementById('perfil-peso').value;
    const metaInput = document.getElementById('perfil-meta');
    const meta_mensal = metaInput ? metaInput.value : 100;

    try {
        const res = await fetch('http://127.0.0.1:5000/atualizar_perfil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id, nome, email, idade, peso, meta_mensal })
        });
        
        const resposta = await res.json();
        if (resposta.sucesso) {
            mostrarNotificacao("Perfil atualizado com sucesso! ✅", 'sucesso');
            localStorage.setItem('usuarioLogado', nome); 
            gerenciarSessao(); 
            carregarProgressoMensal(); // Atualiza a barra com a nova meta
        } else {
            mostrarNotificacao("Erro ao atualizar: " + resposta.mensagem, 'erro');
        }
    } catch (err) {
        mostrarNotificacao("Erro ao conectar com o servidor.", 'erro');
    }
}

async function carregarProgressoMensal() {
    const userId = localStorage.getItem('usuarioId');
    if (!userId) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/progresso?usuario_id=${userId}`);
        const dados = await res.json();
        
        const labelsMeta = document.querySelectorAll('.valor-meta');
        const barrasMeta = document.querySelectorAll('.progress-bar-fill');
        
        let percentagem = (dados.total_corrido / dados.meta) * 100;
        if (percentagem > 100) percentagem = 100;

        labelsMeta.forEach(label => {
            label.innerText = `${dados.total_corrido} / ${dados.meta} km`;
        });
        
        barrasMeta.forEach(barra => {
            barra.style.width = `${percentagem}%`;
        });
    } catch (err) {
        console.error("Erro ao carregar progresso:", err);
    }
}

/* ============================================================ */
/* 6. GRÁFICOS E SEGURANÇA                                      */
/* ============================================================ */

function inicializarGrafico() {
    const canvas = document.getElementById('graficoDashboard');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Treino 1', 'Treino 2', 'Treino 3', 'Treino 4', 'Treino 5'],
            datasets: [{
                label: 'Ritmo Médio',
                data: [6.2, 6.0, 5.8, 5.9, 5.5],
                borderColor: '#1A5CFF',
                backgroundColor: 'rgba(26, 92, 255, 0.1)',
                tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

function toggleSenha(id) {
    const input = document.getElementById(id);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

function validarRequisitosSenha() {
    const senha = document.getElementById('senha');
    if (!senha) return;
    const corSucesso = '#01B574'; 

    senha.addEventListener('input', () => {
        const val = senha.value;
        const temComprimento = val.length >= 8;
        const temMaiuscula = /[A-Z]/.test(val);
        const temNumero = /[0-9]/.test(val);
        const temEspecial = /[@$!%*?&]/.test(val);
        
        document.getElementById('req-comprimento').style.color = temComprimento ? corSucesso : '';
        document.getElementById('req-maiuscula').style.color = temMaiuscula ? corSucesso : '';
        document.getElementById('req-numero').style.color = temNumero ? corSucesso : '';
        
        const reqEspecial = document.getElementById('req-especial');
        if(reqEspecial) reqEspecial.style.color = temEspecial ? corSucesso : '';
        
        const btn = document.querySelector('#form-cadastro button[type="submit"]');
        if (btn) {
            const tudoValido = temComprimento && temMaiuscula && temNumero && temEspecial;
            btn.disabled = !tudoValido;
            btn.style.opacity = tudoValido ? '1' : '0.5';
            btn.style.cursor = tudoValido ? 'pointer' : 'not-allowed';
        }
    });
}

/* ============================================================ */
/* INICIALIZAÇÃO GLOBAL                                         */
/* ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    gerenciarSessao();
    inicializarSimuladorHome();
    inicializarGrafico();
    validarRequisitosSenha();
    
    carregarHistorico();
    carregarPerfil(); 
    carregarProgressoMensal(); 

    const formLogin = document.querySelector('.formulario-login');
    if (formLogin && !window.location.pathname.includes('cadastro')) {
        formLogin.onsubmit = lidarLogin;
    }

    const formCad = document.getElementById('form-cadastro');
    if (formCad) formCad.onsubmit = lidarCadastro;

    const formRegistroRapido = document.getElementById('form-registro-rapido');
    if (formRegistroRapido) formRegistroRapido.onsubmit = lidarRegistroTreino;

    const formPerfil = document.getElementById('form-perfil-pessoal');
    if (formPerfil) formPerfil.onsubmit = lidarAtualizacaoPerfil;
});