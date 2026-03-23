def calcular_plano_ia(peso, pace, frequencia):
    # Lógica da IA
    if pace < 5.5 and frequencia >= 4:
        sugestao = "Treino de Longo: 15km"
    elif pace >= 5.5 and peso > 80:
        sugestao = "Treino de Recuperação: 5km"
    else:
        sugestao = "Treino Moderado: 8km"
        
    # NOVO: Salvando no "Banco de Dados" (Arquivo de texto)
    with open("historico_treinos.txt", "a", encoding="utf-8") as arquivo:
        arquivo.write(f"Peso: {peso}kg | Pace: {pace} | Sugestão: {sugestao}\n")
    
    return sugestao

# Simulação
peso_usuario = 75.0
pace_usuario = 5.2
dias_usuario = 5

resultado = calcular_plano_ia(peso_usuario, pace_usuario, dias_usuario)
print(f"RESPOSTA DA IA: {resultado} (Salvo no histórico!)")