console.log("O arquivo JavaScript está conectado e pronto para uso!");

// 1. Selecionar os elementos do HTML que vamos usar
const inputPace = document.getElementById('input-pace');
const btnCalcular = document.getElementById('btn-calcular');
const divResultado = document.getElementById('resultado-calculo');

// 2. Criar a função que faz o cálculo
function calcularTempoMeiaMaratona() {
    // Pegar o valor digitado (ex: 5.5 que seria 5min 30s)
    const paceDecimal = parseFloat(inputPace.value);
    const distanciaMeia = 21.0975;

    if (isNaN(paceDecimal) || paceDecimal <= 0) {
        divResultado.innerHTML = "<p style='color: red;'>Por favor, insira um pace válido.</p>";
        return;
    }

    // Cálculo: pace (minutos) * distância
    let totalMinutos = paceDecimal * distanciaMeia;

    // Converter minutos totais para formato Horas : Minutos : Segundos
    const horas = Math.floor(totalMinutos / 60);
    const minutosRestantes = Math.floor(totalMinutos % 60);
    const segundos = Math.round((totalMinutos % 1) * 60);

    // 3. Exibir o resultado na tela
    divResultado.innerHTML = `
        <div class="resultado-box">
            <h3>Tempo Estimado:</h3>
            <p>${horas}h ${minutosRestantes}min ${segundos}s</p>
        </div>
    `;
}

// 4. Avisar o botão para "ouvir" o clique do usuário
btnCalcular.addEventListener('click', calcularTempoMeiaMaratona);

// Selecione o novo botão
const btnLimpar = document.getElementById('btn-limpar');

// Função para bloquear letras e símbolos no campo numérico
inputPace.addEventListener('keydown', function(e) {
    // Bloqueia 'e', '+', '-', ',' e '.' (se quiser apenas números inteiros)
    // Deixamos o '.' pois seu cálculo usa decimais
    if (['e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
    }
});

// Função para Limpar tudo
btnLimpar.addEventListener('click', () => {
    inputPace.value = "";
    divResultado.innerHTML = "";
    console.log("Calculadora reiniciada.");
});

// ... mantenha sua função calcularTempoMeiaMaratona abaixo ...