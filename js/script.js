/* ============================================================ */
/* SEÇÃO 1: SIMULADOR DE TREINO (Página Inicial)                */
/* ============================================================ */
const inputPace = document.getElementById('input-pace');
const btnCalcular = document.getElementById('btn-calcular');
const btnLimpar = document.getElementById('btn-limpar');
const divResultado = document.getElementById('resultado-calculo');

if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        const paceDecimal = parseFloat(inputPace.value);
        if (isNaN(paceDecimal) || paceDecimal <= 0) {
            divResultado.innerHTML = "<p style='color: #ff4d4d;'>Insira um pace válido.</p>";
            return;
        }
        let totalMinutos = paceDecimal * 21.0975;
        const h = Math.floor(totalMinutos / 60);
        const m = Math.floor(totalMinutos % 60);
        const s = Math.round((totalMinutos % 1) * 60);
        divResultado.innerHTML = `<div class="resultado-box"><h3>Tempo Estimado:</h3><p>${h}h ${m}min ${s}s</p></div>`;
    });
}
if (btnLimpar) {
    btnLimpar.addEventListener('click', () => { inputPace.value = ""; divResultado.innerHTML = ""; });
}

/* ============================================================ */
/* SEÇÃO 2: UTILITÁRIOS (Visibilidade de Senha)                 */
/* ============================================================ */
function toggleSenha(idInput) {
    const input = document.getElementById(idInput);
    if (input) input.type = input.type === "password" ? "text" : "password";
}

/* ============================================================ */
/* SEÇÃO 3: VALIDAÇÃO DO CADASTRO                               */
/* ============================================================ */
const campoSenha = document.getElementById('senha');
const campoConfirmar = document.getElementById('confirmar-senha');
const btnRegistrar = document.getElementById('btn-registrar');

function validarFormulario() {
    if (!campoSenha || !campoConfirmar) return;
    const s = campoSenha.value;
    const c = campoConfirmar.value;

    const v1 = s.length >= 8;
    const v2 = /[A-Z]/.test(s);
    const v3 = /[0-9]/.test(s);
    const v4 = /[@$!%*?&]/.test(s);
    const vConf = s === c && s !== "";

    // Feedback visual
    const m = (cond, id) => document.getElementById(id).classList.toggle('valido', cond);
    m(v1, 'req-comprimento'); m(v2, 'req-maiuscula'); m(v3, 'req-numero'); m(v4, 'req-especial');
    
    document.getElementById('erro-confirmacao').style.display = (c !== "" && !vConf) ? "block" : "none";

    const ok = v1 && v2 && v3 && v4 && vConf;
    if (btnRegistrar) {
        btnRegistrar.disabled = !ok;
        btnRegistrar.style.opacity = ok ? "1" : "0.5";
    }
}

if (campoSenha) {
    campoSenha.addEventListener('input', validarFormulario);
    campoConfirmar.addEventListener('input', validarFormulario);
}

/* ============================================================ */
/* SEÇÃO 4: INTEGRAÇÃO COM A IA (Fetch para o Flask)            */
/* ============================================================ */
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dados = {
            peso: document.getElementById('peso').value,
            frequencia: document.getElementById('frequencia').value,
            pace: document.getElementById('pace-cadastro').value
        };
        try {
            const res = await fetch('http://127.0.0.1:5000/calcular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const info = await res.json();
            if (info.plano) {
                localStorage.setItem('planoIA', info.plano);
                window.location.href = 'plano.html';
            }
        } catch {
            alert("Erro: O servidor Python está ligado?");
        }
    });
}