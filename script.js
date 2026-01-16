import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// SEGURANÇA: Mude a senha abaixo para a sua preferência
const SENHA_MODERADOR = "281920"; 

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

// Iniciar Placar e Jogo
window.iniciarJogo = function() {
    const qtd = document.getElementById('qtd_equipes').value;
    const container = document.getElementById('placar-container');
    container.innerHTML = '';
    pontuacoes = {};
    for(let i = 1; i <= qtd; i++) {
        pontuacoes[i] = 0;
        container.innerHTML += `
            <div class="equipe-card cor-eqp-${i}">
                <span class="equipe-nome">EQP ${i}</span>
                <span class="equipe-pontos" id="pontos-eqp-${i}">0</span>
                <div style="display:flex; justify-content:center;">
                    <button style="width:30px; height:30px; padding:0; margin:2px;" onclick="alterarPonto(${i},1)">+</button>
                    <button style="width:30px; height:30px; padding:0; margin:2px;" onclick="alterarPonto(${i},-1)">-</button>
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
    btn.innerText = `${n} - ${dicasAtuais[`dica${n}`]}`;
    btn.classList.add('revelada');
};

window.sortearNovaCarta = async function() {
    const dbRef = ref(getDatabase());
    try {
        const snapshot = await get(child(dbRef, 'personagens'));
        if (snapshot.exists()) {
            const lista = snapshot.val();
            const chaves = Object.keys(lista);
            const sorteado = chaves[Math.floor(Math.random() * chaves.length)];
            const dados = lista[sorteado];
            document.getElementById('display-categoria').innerText = dados.categoria;
            document.getElementById('display-nome').innerText = dados.nome;
            dicasAtuais = dados.dicas;
            for(let i=1; i<=10; i++) {
                const btn = document.getElementById(`btn-dica${i}`);
                btn.innerText = `Dica ${i}`;
                btn.classList.remove('revelada');
            }
        }
    } catch (e) { console.error(e); }
};

window.proximaCarta = () => window.sortearNovaCarta();

// SALVAMENTO PROTEGIDO POR SENHA
window.processarSalvamento = async function() {
    const senhaDigitada = prompt("Senha de Moderador para autorizar:");
    if (senhaDigitada !== SENHA_MODERADOR) {
        return alert("Senha incorreta! Operação negada.");
    }

    const nomeInput = document.getElementById('txt_personagem');
    const nome = nomeInput.value.trim().toUpperCase();
    if(!nome) return alert("Digite o nome!");

    const dbRef = ref(getDatabase());
    const snapshot = await get(child(dbRef, `personagens/${nome}`));
    if (snapshot.exists()) {
        if (!confirm(`A carta "${nome}" já existe. Substituir?`)) return;
    }

    const categoria = document.getElementById('sel_categoria').value;
    const dicas = {};
    for(let i=1; i<=10; i++) {
        dicas[`dica${i}`] = document.getElementById(`dica${i}`).value || "Não informada";
    }

    set(ref(db, 'personagens/' + nome), { nome, categoria, dicas })
    .then(() => {
        alert("Carta salva!");
        nomeInput.value = "";
        for(let i=1; i<=10; i++) document.getElementById(`dica${i}`).value = "";
    });
};
