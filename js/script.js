/* ============================================================ */
/* SEÇÃO 1: SIMULADOR DE TREINO (PACE CALCULATOR)               */
/* ============================================================ */

// Seleção de elementos da calculadora
const inputPace = document.getElementById('input-pace');
const btnCalcular = document.getElementById('btn-calcular');
const btnLimpar = document.getElementById('btn-limpar');
const divResultado = document.getElementById('resultado-calculo');

// Função de Cálculo (usada no index.html)
if (btnCalcular) {
    btnCalcular.addEventListener('click', () => {
        const paceDecimal = parseFloat(inputPace.value);
        const distanciaMeia = 21.0975;

        if (isNaN(paceDecimal) || paceDecimal <= 0) {
            divResultado.innerHTML = "<p style='color: #ff4d4d;'>Insira um pace válido.</p>";
            return;
        }

        let totalMinutos = paceDecimal * distanciaMeia;
        const horas = Math.floor(totalMinutos / 60);
        const minutosRestantes = Math.floor(totalMinutos % 60);
        const segundos = Math.round((totalMinutos % 1) * 60);

        divResultado.innerHTML = `
            <div class="resultado-box">
                <h3>Tempo Estimado:</h3>
                <p>${horas}h ${minutosRestantes}min ${segundos}s</p>
            </div>
        `;
    });
}

// Função de Limpar
if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
        inputPace.value = "";
        divResultado.innerHTML = "";
    });
}

/* ============================================================ */
/* SEÇÃO 2: UTILITÁRIOS (VISIBILIDADE DE SENHA)                 */
/* ============================================================ */

// Funciona tanto no login quanto no cadastro
function toggleSenha(idInput) {
    const input = document.getElementById(idInput);
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}

/* ============================================================ */
/* SEÇÃO 3: VALIDAÇÃO DE SEGURANÇA E REGISTO                    */
/* ============================================================ */

// Elementos do formulário de cadastro
const campoSenha = document.getElementById('senha');
const campoConfirmar = document.getElementById('confirmar-senha');
const btnRegistrar = document.getElementById('btn-registrar');
const erroConfirmacao = document.getElementById('erro-confirmacao');

// Elementos da lista de requisitos
const reqs = {
    comprimento: document.getElementById('req-comprimento'),
    maiuscula: document.getElementById('req-maiuscula'),
    numero: document.getElementById('req-numero'),
    especial: document.getElementById('req-especial')
};

// Função para mudar a cor das dicas (cinza para verde)
function validarCriterio(condicao, elemento) {
    if (elemento) {
        condicao ? elemento.classList.add('valido') : elemento.classList.remove('valido');
    }
}

// Função principal de validação do formulário
function validarFormulario() {
    // Verifica se estamos na página de cadastro (onde esses campos existem)
    if (!campoSenha || !campoConfirmar) return; 

    const senha = campoSenha.value;
    const confirma = campoConfirmar.value;

    // 1. Testes de Requisitos (Regex)
    const vComprimento = senha.length >= 8;
    const vMaiuscula = /[A-Z]/.test(senha);
    const vNumero = /[0-9]/.test(senha);
    const vEspecial = /[@$!%*?&]/.test(senha);
    
    // 2. Teste de Confirmação (Senhas iguais)
    const vConfirmacao = senha === confirma && senha !== "";

    // 3. Atualizar feedback visual dos requisitos
    validarCriterio(vComprimento, reqs.comprimento);
    validarCriterio(vMaiuscula, reqs.maiuscula);
    validarCriterio(vNumero, reqs.numero);
    validarCriterio(vEspecial, reqs.especial);

    // 4. Mostrar erro se as senhas forem diferentes
    if (confirma !== "" && !vConfirmacao) {
        erroConfirmacao.style.display = "block";
    } else {
        erroConfirmacao.style.display = "none";
    }

    // 5. TRAVA DE SEGURANÇA FINAL
    // O botão só habilita se todos os critérios E a confirmação forem verdadeiros
    const formularioValido = vComprimento && vMaiuscula && vNumero && vEspecial && vConfirmacao;
    
    if (btnRegistrar) {
        btnRegistrar.disabled = !formularioValido;
        // Ajuste visual para o botão parecer "apagado" quando bloqueado
        btnRegistrar.style.opacity = formularioValido ? "1" : "0.5";
        btnRegistrar.style.cursor = formularioValido ? "pointer" : "not-allowed";
    }
}

// Adiciona os eventos de escuta (apenas se os campos existirem na página)
if (campoSenha && campoConfirmar) {
    campoSenha.addEventListener('input', validarFormulario);
    campoConfirmar.addEventListener('input', validarFormulario);
}