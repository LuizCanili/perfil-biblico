import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const SENHA_MODERADOR = "1234"; 

const firebaseConfig = {
    apiKey: "AIzaSyCWXSzJMGkH5XG8s5THKLLh_EGf1xT_3hU",
    authDomain: "perfilbiblico-7ba7e.firebaseapp.com",
    databaseURL: "https://perfilbiblico-7ba7e-default-rtdb.firebaseio.com",
    projectId: "perfilbiblico-7ba7e",
    storageBucket: "perfilbiblico-7ba7e.appspot.com",
    messagingSenderId: "1015160624873",
    appId: "1:1015160624873:web:dc75fc3e9c89f0ba5b0278"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let dicasAtuais = {};
let pontuacoes = {};
let cartasSorteadas = [];

// --- LOGICA DE JOGO ---
window.iniciarJogo = function() {
    const qtd = document.getElementById('qtd_equipes').value;
    const container = document.getElementById('placar-container');
    container.innerHTML = '';
    pontuacoes = {};
    cartasSorteadas = [];

    for(let i = 1; i <= qtd; i++) {
        pontuacoes[i] = 0;
        container.innerHTML += `
            <div class="equipe-card cor-eqp-${i}">
                <span style="font-size:0.6rem; font-weight:bold;">EQP ${i}</span>
                <span class="equipe-pontos" id="pontos-eqp-${i}">0</span>
                <div style="display:flex; justify-content:center; gap:2px;">
                    <button style="width:28px; height:28px; padding:0;" onclick="alterarPonto(${i},1)">+</button>
                    <button style="width:28px; height:28px; padding:0;" onclick="alterarPonto(${i},-1)">-</button>
                </div>
            </div>`;
    }
    window.showScreen('screen2');
    window.sortearNovaCarta();
};

window.alterarPonto = (eq, val) => {
    pontuacoes[eq] = Math.max(0, pontuacoes[eq] + val);
    document.getElementById(`pontos-eqp-${eq}`).innerText = pontuacoes[eq];
};

window.revelarDica = (n) => {
    const btn = document.getElementById(`btn-dica${n}`);
    if(dicasAtuais[`dica${n}`]) {
        btn.innerText = `${n} - ${dicasAtuais[`dica${n}`]}`;
        btn.classList.add('revelada');
    }
};

window.sortearNovaCarta = async function() {
    const dbRef = ref(getDatabase());
    try {
        const snapshot = await get(child(dbRef, 'personagens'));
        if (snapshot.exists()) {
            const listaCompleta = snapshot.val();
            const todasChaves = Object.keys(listaCompleta);
            const disponiveis = todasChaves.filter(chave => !cartasSorteadas.includes(chave));

            if (disponiveis.length === 0) {
                alert("O ACERVO CHEGOU AO FIM! O sorteio será reiniciado ao sair.");
                document.getElementById('display-nome').innerText = "FIM DO BARALHO";
                return;
            }

            const sorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)];
            cartasSorteadas.push(sorteado);
            const dados = listaCompleta[sorteado];
            document.getElementById('display-categoria').innerText = dados.categoria;
            document.getElementById('display-nome').innerText = dados.nome;
            dicasAtuais = dados.dicas;

            for(let i=1; i<=10; i++) {
                const btn = document.getElementById(`btn-dica${i}`);
                if(btn) { btn.innerText = `Dica ${i}`; btn.classList.remove('revelada'); }
            }
        }
    } catch (e) { console.error(e); }
};

window.proximaCarta = () => window.sortearNovaCarta();

// --- CADASTRO E ACERVO CATEGORIZADO ---
window.processarSalvamento = async function() {
    const senha = prompt("Senha de Moderador:");
    if (senha !== SENHA_MODERADOR) return alert("Senha incorreta!");
    const nomeInput = document.getElementById('txt_personagem');
    const nome = nomeInput.value.trim().toUpperCase();
    if(!nome) return alert("Digite o nome!");
    const categoria = document.getElementById('sel_categoria').value;
    const dicas = {};
    for(let i=1; i<=10; i++) { dicas[`dica${i}`] = document.getElementById(`dica${i}`).value || "Vazio"; }
    set(ref(db, 'personagens/' + nome), { nome, categoria, dicas })
    .then(() => { alert("Salvo!"); nomeInput.value = ""; for(let i=1; i<=10; i++) document.getElementById(`dica${i}`).value = ""; });
};

window.abrirListagem = async function() {
    const container = document.getElementById('lista-cartas-container');
    container.innerHTML = "Carregando acervo...";
    window.showScreen('screen4');
    const dbRef = ref(getDatabase());
    try {
        const snapshot = await get(child(dbRef, 'personagens'));
        if (snapshot.exists()) {
            const listaBruta = snapshot.val();
            const grupos = { "Personagem": [], "Lugar": [], "Coisa": [] };
            Object.values(listaBruta).forEach(carta => { if (grupos[carta.categoria]) grupos[carta.categoria].push(carta.nome); });
            container.innerHTML = "";
            for (let categoria in grupos) {
                if (grupos[categoria].length > 0) {
                    grupos[categoria].sort();
                    let htmlBloco = `<div class="categoria-bloco"><div class="categoria-titulo-lista">${categoria} (${grupos[categoria].length})</div>`;
                    grupos[categoria].forEach(nome => {
                        htmlBloco += `<div class="carta-item"><span>${nome}</span><button class="btn-excluir" onclick="excluirCarta('${nome}')">EXCLUIR</button></div>`;
                    });
                    container.innerHTML += htmlBloco + `</div>`;
                }
            }
        } else { container.innerHTML = "Nenhuma carta cadastrada."; }
    } catch (e) { container.innerHTML = "Erro ao carregar."; }
};

window.excluirCarta = async function(nome) {
    const senha = prompt(`Senha para excluir "${nome}":`);
    if (senha !== SENHA_MODERADOR) return alert("Incorreta!");
    if (confirm("Apagar permanentemente?")) {
        remove(ref(db, 'personagens/' + nome)).then(() => { alert("Excluída!"); window.abrirListagem(); });
    }
};
