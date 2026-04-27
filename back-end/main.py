from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Permite a comunicação entre o site e o Python

def calcular_plano_ia(peso, pace, frequencia):
    # FÓRMULA DINÂMICA (IA v1.5)
    # A distância baseia-se na frequência e no fôlego (pace)
    base_distancia = frequencia * 2.5 
    ajuste_pace = (10 - pace) 
    
    # Redução de 15% na carga se o peso for superior a 85kg (Segurança)
    multiplicador_seguranca = 0.85 if peso > 85 else 1.0
    
    distancia_final = (base_distancia + ajuste_pace) * multiplicador_seguranca
    distancia_final = round(max(3.0, distancia_final), 1) # Mínimo de 3km
    
    sugestao = f"Treino Personalizado: {distancia_final}km"
    
    # Salva no arquivo de texto
    with open("historico_treinos.txt", "a", encoding="utf-8") as arquivo:
        arquivo.write(f"Peso: {peso}kg | Pace: {pace} | Freq: {frequencia} | Sugestão: {sugestao}\n")
    
    return sugestao

@app.route('/calcular', methods=['POST'])
def api_calcular():
    try:
        dados = request.json
        peso = float(dados.get('peso'))
        pace = float(dados.get('pace'))
        freq = int(dados.get('frequencia'))
        plano = calcular_plano_ia(peso, pace, freq)
        return jsonify({"plano": plano})
    except Exception as e:
        return jsonify({"erro": str(e)}), 400

@app.route('/historico', methods=['GET'])
def obter_historico():
    try:
        with open("historico_treinos.txt", "r", encoding="utf-8") as arquivo:
            linhas = arquivo.readlines()
        return jsonify({"historico": linhas})
    except:
        return jsonify({"historico": []})

if __name__ == '__main__':
    app.run(debug=True, port=5000)