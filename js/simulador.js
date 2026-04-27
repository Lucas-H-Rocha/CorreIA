/**
 * Projeto CorreIA - Módulo Simulador de Ritmo
 * Autor: Estudante de Análise e Desenvolvimento
 * Orientador: IA Pedagógica
 */

document.addEventListener("DOMContentLoaded", function() {
    // 1. Instanciação dos Elementos do DOM
    const inputPace = document.getElementById('paceInput');
    const selectDistancia = document.getElementById('distanciaSelect');
    const btnSimular = document.getElementById('btnSimular');
    const displayResultado = document.getElementById('tempoEstimadoDisplay');
    const mensagemErro = document.getElementById('erroPace');

    // 2. Máscara de Entrada Dinâmica para o Pace
    inputPace.addEventListener('input', function(evento) {
        let valor = evento.target.value;
        
        // Remove caracteres não numéricos
        valor = valor.replace(/\D/g, "");
        
        // Injeta o separador ':'
        if (valor.length > 2) {
            valor = valor.substring(0, 2) + ":" + valor.substring(2, 4);
        }
        
        evento.target.value = valor;

        // Limpa o estado de erro assim que o usuário volta a digitar
        if (inputPace.style.borderColor === 'red') {
            inputPace.style.borderColor = '';
            mensagemErro.style.display = 'none';
        }
    });

    // 3. Execução do Cálculo de Tempo Estimado
    btnSimular.addEventListener('click', function() {
        const paceValor = inputPace.value;
        const distancia = parseFloat(selectDistancia.value);

        // Validação rigorosa: O Pace deve ter exatamente 5 caracteres (ex: 05:30)
        if (paceValor.length !== 5) {
            // Aplicação de feedback visual de erro
            inputPace.style.borderColor = 'red';
            mensagemErro.style.display = 'block';
            displayResultado.innerText = "--min --s";
            return; // Interrompe a execução
        }

        // Decomposição da string de Pace
        const partesPace = paceValor.split(':');
        const minutos = parseInt(partesPace[0]);
        const segundos = parseInt(partesPace[1]);

        // Validação lógica: Segundos não podem ser maiores que 59
        if (segundos > 59) {
            inputPace.style.borderColor = 'red';
            mensagemErro.innerText = "Segundos não podem exceder 59.";
            mensagemErro.style.display = 'block';
            displayResultado.innerText = "--min --s";
            return;
        }

        // Processamento Matemático
        const tempoPaceSegundos = (minutos * 60) + segundos;
        const tempoTotalSegundos = Math.round(tempoPaceSegundos * distancia);

        // Extração das grandezas de tempo
        const horasFinais = Math.floor(tempoTotalSegundos / 3600);
        const minutosRestantes = Math.floor((tempoTotalSegundos % 3600) / 60);
        const segundosFinais = tempoTotalSegundos % 60;

        // Construção da String de Saída
        let textoResultado = "";
        
        if (horasFinais > 0) {
            textoResultado += `${horasFinais}h `;
        }
        
        // Formatação para garantir dois dígitos (ex: 05s em vez de 5s)
        const minFormatado = minutosRestantes.toString().padStart(2, '0');
        const segFormatado = segundosFinais.toString().padStart(2, '0');
        
        textoResultado += `${minFormatado}min ${segFormatado}s`;

        // Renderização Final
        displayResultado.innerText = textoResultado;
        
        // Garantia de estado visual limpo em caso de sucesso
        inputPace.style.borderColor = 'green';
        mensagemErro.style.display = 'none';
    });
});