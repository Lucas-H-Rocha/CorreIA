from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATABASE = 'correai.db'

# --- UTILITÁRIOS DE BASE DE DADOS ---

def conectar_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = conectar_db()
    cursor = conn.cursor()
    
    # Tabela de Utilizadores
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            nome TEXT NOT NULL,
            idade INTEGER,
            peso_inicial REAL,
            tipo TEXT NOT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Atualiza a tabela com a meta mensal se ela não existir
    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN meta_mensal REAL DEFAULT 100.0")
    except sqlite3.OperationalError:
        pass # A coluna já existe
        
    # Tabela de Treinos (IA)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS treinos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            peso_atual REAL,
            pace REAL,
            frequencia INTEGER,
            distancia_alvo TEXT,
            sugestao TEXT,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    
    # Tabela para as Corridas Manuais
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS corridas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            distancia REAL NOT NULL,
            tempo TEXT NOT NULL,
            rota TEXT NOT NULL,
            registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    
    # Criar Utilizadores de Teste
    try:
        cursor.execute("INSERT INTO usuarios (email, senha, nome, tipo, idade, peso_inicial) VALUES (?, ?, ?, ?, ?, ?)", 
                       ("lucas@email.com", "123", "Lucas", "user", 25, 75.0))
        cursor.execute("INSERT INTO usuarios (email, senha, nome, tipo) VALUES (?, ?, ?, ?)", 
                       ("admin@correai.com", "admin", "Administrador", "admin"))
    except sqlite3.IntegrityError:
        pass 
        
    conn.commit()
    conn.close()

init_db()


# --- LÓGICA DE INTELIGÊNCIA ARTIFICIAL ---

def calcular_plano_ia(usuario_id, peso, pace, frequencia, meta):
    fator_ritmo = (10 - pace) * 0.5
    bases_meta = {'5k': 3.0, '10k': 6.5, '21k': 11.0, '42k': 20.0}
    distancia_base = bases_meta.get(meta, 5.0)
    bonus_frequencia = frequencia * 0.4
    redutor_peso = 0.9 if peso > 90 else 1.0 
    distancia_final = round((distancia_base + fator_ritmo + bonus_frequencia) * redutor_peso, 1)
    
    sugestao = f"Treino Sugerido para {meta}: {max(2.0, distancia_final)}km"
    
    conn = conectar_db()
    conn.execute('''INSERT INTO treinos (usuario_id, peso_atual, pace, frequencia, distancia_alvo, sugestao) 
                    VALUES (?, ?, ?, ?, ?, ?)''', 
                 (usuario_id, peso, pace, frequencia, meta, sugestao))
    conn.commit()
    conn.close()
    
    return sugestao


# --- ROTAS DA API ---

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    conn = conectar_db()
    user = conn.execute("SELECT * FROM usuarios WHERE email = ? AND senha = ?", 
                        (dados['email'], dados['senha'])).fetchone()
    conn.close()
    
    if user:
        return jsonify({"sucesso": True, "id": user['id'], "nome": user['nome'], "tipo": user['tipo']})
    return jsonify({"sucesso": False, "mensagem": "Credenciais Inválidas"}), 401


@app.route('/cadastro', methods=['POST'])
def cadastro():
    dados = request.json
    conn = conectar_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO usuarios (nome, email, senha, peso_inicial, tipo) 
            VALUES (?, ?, ?, ?, 'user')
        ''', (dados['nome'], dados['email'], dados['senha'], float(dados['peso'])))
        usuario_id = cursor.lastrowid
        conn.commit()
        
        calcular_plano_ia(usuario_id, float(dados['peso']), float(dados['pace']), int(dados['frequencia']), dados['distancia_alvo'])
        
        return jsonify({"sucesso": True, "id": usuario_id, "nome": dados['nome'], "tipo": "user"})
    except sqlite3.IntegrityError:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": "Este e-mail já está em uso!"}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": str(e)}), 500
    finally:
        conn.close()


@app.route('/calcular', methods=['POST'])
def api_calcular():
    try:
        d = request.json
        plano = calcular_plano_ia(int(d['usuario_id']), float(d['peso']), float(d['pace']), int(d['frequencia']), d['distancia_alvo'])
        return jsonify({"plano": plano, "sucesso": True})
    except Exception as e:
        return jsonify({"sucesso": False, "erro": str(e)}), 400


@app.route('/historico', methods=['GET'])
def obter_historico():
    uid = request.args.get('usuario_id')
    tipo = request.args.get('tipo')
    conn = conectar_db()
    if tipo == 'admin':
        dados = conn.execute('''
            SELECT t.*, u.nome FROM treinos t 
            JOIN usuarios u ON t.usuario_id = u.id ORDER BY t.data DESC
        ''').fetchall()
    else:
        dados = conn.execute("SELECT * FROM treinos WHERE usuario_id = ? ORDER BY data DESC", (uid,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in dados])


@app.route('/admin/limpar', methods=['DELETE'])
def limpar_tudo():
    conn = conectar_db()
    conn.execute("DELETE FROM treinos")
    conn.commit()
    conn.close()
    return jsonify({"sucesso": True, "mensagem": "Histórico SQL limpo com sucesso!"})


@app.route('/registrar_corrida', methods=['POST'])
def registrar_corrida():
    dados = request.json
    conn = conectar_db()
    try:
        conn.execute('''
            INSERT INTO corridas (usuario_id, data, distancia, tempo, rota) 
            VALUES (?, ?, ?, ?, ?)
        ''', (dados['usuario_id'], dados['data'], float(dados['distancia']), dados['tempo'], dados['rota']))
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Treino registado com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": str(e)}), 500
    finally:
        conn.close()


@app.route('/perfil', methods=['GET'])
def obter_perfil():
    uid = request.args.get('usuario_id')
    conn = conectar_db()
    user = conn.execute("SELECT nome, email, idade, peso_inicial, meta_mensal FROM usuarios WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if user: return jsonify(dict(user))
    return jsonify({"erro": "Utilizador não encontrado"}), 404


@app.route('/atualizar_perfil', methods=['POST'])
def atualizar_perfil():
    dados = request.json
    conn = conectar_db()
    try:
        conn.execute('''
            UPDATE usuarios 
            SET nome = ?, email = ?, idade = ?, peso_inicial = ?, meta_mensal = ?
            WHERE id = ?
        ''', (dados['nome'], dados['email'], dados['idade'], dados['peso'], dados.get('meta_mensal', 100), dados['usuario_id']))
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Perfil atualizado com sucesso!"})
    except Exception as e:
        conn.rollback()
        return jsonify({"sucesso": False, "mensagem": str(e)}), 500
    finally:
        conn.close()


@app.route('/progresso', methods=['GET'])
def obter_progresso():
    uid = request.args.get('usuario_id')
    conn = conectar_db()
    
    user = conn.execute("SELECT meta_mensal FROM usuarios WHERE id = ?", (uid,)).fetchone()
    meta = user['meta_mensal'] if user and user['meta_mensal'] else 100.0
    
    mes_atual = datetime.now().strftime('%Y-%m')
    result = conn.execute("SELECT SUM(distancia) as total FROM corridas WHERE usuario_id = ? AND data LIKE ?", (uid, f"{mes_atual}%")).fetchone()
    
    total_corrido = result['total'] if result['total'] else 0.0
    conn.close()
    
    return jsonify({"meta": meta, "total_corrido": round(total_corrido, 1)})

# NOVO: Rota de Estatísticas para o Painel Admin
@app.route('/admin/stats', methods=['GET'])
def admin_stats():
    conn = conectar_db()
    
    # 1. Total de utilizadores (corredores)
    users = conn.execute("SELECT COUNT(id) as count FROM usuarios WHERE tipo = 'user'").fetchone()
    total_users = users['count'] if users else 0
    
    # 2. Total de treinos gerados pela IA
    treinos = conn.execute("SELECT COUNT(id) as count FROM treinos").fetchone()
    total_treinos = treinos['count'] if treinos else 0
    
    # 3. Quilómetros corridos no mês
    mes_atual = datetime.now().strftime('%Y-%m')
    km = conn.execute("SELECT SUM(distancia) as total FROM corridas WHERE data LIKE ?", (f"{mes_atual}%",)).fetchone()
    total_km = round(km['total'], 1) if km and km['total'] else 0.0
    
    # 4. Tabela de Últimos Utilizadores
    ultimos_users = conn.execute("SELECT nome, email, criado_em, meta_mensal FROM usuarios WHERE tipo = 'user' ORDER BY criado_em DESC LIMIT 5").fetchall()
    
    conn.close()
    
    return jsonify({
        "total_users": total_users,
        "total_treinos": total_treinos,
        "total_km": total_km,
        "usuarios": [dict(u) for u in ultimos_users]
    })

# IMPORTANTE: Isto tem de ser a última coisa do ficheiro!
if __name__ == '__main__':
    app.run(debug=True, port=5000)