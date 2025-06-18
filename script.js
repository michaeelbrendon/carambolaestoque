// script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Configuração Firebase - substitua pelos seus dados reais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDtKKeamDkDcT_0bGp79PNnZ1k_ThaCyhk",
    authDomain: "estoquecarambola2.firebaseapp.com",
    projectId: "estoquecarambola2",
    storageBucket: "estoquecarambola2.firebasestorage.app",
    messagingSenderId: "381269040819",
    appId: "1:381269040819:web:86b389b25a70b7f8329ac6",
    measurementId: "G-WBETYR66TP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const filtroBusca = document.getElementById("filtroBusca");
const mensagemSucesso = document.getElementById("mensagemSucesso");
const cancelarEdicaoBtn = document.getElementById("cancelarEdicaoBtn");

const abas = {
    cadastro: document.getElementById("abaCadastro"),
    visualizar: document.getElementById("abaVisualizar"),
    grafico: document.getElementById("abaGrafico"),
};

const btnCadastro = document.getElementById("abaCadastroBtn");
const btnVisualizar = document.getElementById("abaVisualizarBtn");
const btnGrafico = document.getElementById("abaGraficoBtn");
const btnExportar = document.getElementById("exportarBtn");

const campos = [
    "nome",
    "cor",
    "quantidade",
    "embalagem",
    "valorpdv",
    "investimento",
    "montante",
];

let editandoId = null; // agora guarda o id do documento Firestore
let produtos = []; // array local cache

function mostrarMensagem(msg) {
    mensagemSucesso.textContent = msg;
    mensagemSucesso.classList.remove("hidden");
    setTimeout(() => mensagemSucesso.classList.add("hidden"), 3000);
}

function limparFormulario() {
    campos.forEach((campo) => {
        document.getElementById(campo).value = "";
    });
    editandoId = null;
    cancelarEdicaoBtn.classList.add("hidden");
}

function calcularMontanteAutomaticamente() {
    const embalagem = parseFloat(document.getElementById("embalagem").value) || 0;
    const investimento =
        parseFloat(document.getElementById("investimento").value) || 0;
    const quantidade = parseFloat(document.getElementById("quantidade").value) || 0;

    const montante = (embalagem + investimento);
    document.getElementById("montante").value = montante.toFixed(2);
}

// Salvar ou atualizar produto no Firestore
async function salvarProduto(event) {
    event.preventDefault();

    let novoProduto = {};
    for (const campo of campos) {
        const input = document.getElementById(campo);
        if (
            input.type === "number" &&
            campo !== "nome" &&
            campo !== "cor" &&
            campo !== "montante"
        ) {
            novoProduto[campo] = parseFloat(input.value) || 0;
        } else {
            novoProduto[campo] = input.value.trim();
        }
    }

    // Cálculo automático do montante (reforço)
    novoProduto.montante =
        (parseFloat(novoProduto.embalagem) + parseFloat(novoProduto.investimento)) *
        parseFloat(novoProduto.quantidade);

    try {
        if (editandoId) {
            // Atualizar
            const docRef = doc(db, "produtos", editandoId);
            await updateDoc(docRef, novoProduto);
            mostrarMensagem("Produto atualizado com sucesso!");
        } else {
            // Salvar novo
            await addDoc(collection(db, "produtos"), novoProduto);
            mostrarMensagem("Produto salvo com sucesso!");
        }
        limparFormulario();
    } catch (error) {
        alert("Erro ao salvar produto: " + error.message);
    }
}

async function darBaixa(id, produtoAtual) {
    const quantidadeSaida = prompt("Digite a quantidade a dar baixa:");
    const qtd = parseInt(quantidadeSaida);

    console.log("Produto atual recebido:", produtoAtual);
    console.log("Quantidade digitada:", qtd);

    if (!isNaN(qtd) && qtd > 0 && parseFloat(produtoAtual.quantidade) >= qtd) {
        const novaQuantidade = parseFloat(produtoAtual.quantidade) - qtd;
        console.log("Nova quantidade após baixa:", novaQuantidade);

        try {
            const docRef = doc(db, "produtos", id);
            await updateDoc(docRef, {
                quantidade: novaQuantidade
            });

            mostrarMensagem("Baixa realizada com sucesso!");
            escutarProdutos();
        } catch (error) {
            console.error("Erro ao dar baixa:", error);
            alert("Erro ao dar baixa no produto.");
        }
    } else {
        alert("Quantidade inválida!");
    }
}



// Excluir produto do Firestore
async function excluirProduto(id) {
    if (confirm("Deseja realmente excluir este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
            mostrarMensagem("Produto excluído com sucesso!");
        } catch (error) {
            alert("Erro ao excluir produto: " + error.message);
        }
    }
}

// Preenche formulário para editar
function preencherFormulario(produto) {
    editandoId = produto.id;
    campos.forEach((campo) => {
        document.getElementById(campo).value = produto[campo];
    });
    cancelarEdicaoBtn.classList.remove("hidden");
    btnCadastro.click();
}

// Atualiza a tabela com dados do Firestore, com filtro e ordenação
let ordemAtual = { coluna: null, crescente: true };

function atualizarTabela() {
    const filtro = filtroBusca.value.toLowerCase();

    let produtosFiltrados = produtos.filter((p) =>
        p.nome.toLowerCase().includes(filtro)
    );

    if (ordemAtual.coluna) {
        produtosFiltrados.sort((a, b) => {
            if (a[ordemAtual.coluna] < b[ordemAtual.coluna])
                return ordemAtual.crescente ? -1 : 1;
            if (a[ordemAtual.coluna] > b[ordemAtual.coluna])
                return ordemAtual.crescente ? 1 : -1;
            return 0;
        });
    }

    tabelaProdutos.innerHTML = "";

    produtosFiltrados.forEach((produto) => {
        const tr = document.createElement("tr");
        tr.classList.add(
            produtosFiltrados.indexOf(produto) % 2 === 0 ? "bg-white" : "bg-orange-50"
        );
        tr.innerHTML = `
      <td class="p-2 border border-orange-200">${produto.nome}</td>
      <td class="p-2 border border-orange-200">${produto.cor}</td>
      <td class="p-2 border border-orange-200">${produto.quantidade}</td>
      <td class="p-2 border border-orange-200">${produto.embalagem.toFixed(2)}</td>
      <td class="p-2 border border-orange-200">${produto.valorpdv.toFixed(2)}</td>
      <td class="p-2 border border-orange-200">${produto.investimento.toFixed(2)}</td>
      <td class="p-2 border border-orange-200">${produto.montante.toFixed(2)}</td>
      <td class="p-2 border border-orange-200">
        <button class="editarBtn bg-yellow-300 px-2 py-1 rounded mr-2">Editar</button>
        <button class="excluirBtn bg-red-400 text-white px-2 py-1 rounded">Excluir</button>
        <button class="darbaixaBtn bg-orange-400 text-white px-2 py-1 rounded">Baixa</button>
      </td>
    `;

        tabelaProdutos.appendChild(tr);

        tr.querySelector(".editarBtn").addEventListener("click", () => {
            preencherFormulario(produto);
        });

        tr.querySelector(".excluirBtn").addEventListener("click", () => {
            excluirProduto(produto.id);
        });

        tr.querySelector('.darbaixaBtn').addEventListener('click', () => {
            darBaixa(produto.id, produto);
        });

    });
}

// Atualiza gráfico de lucro
let chart;

function atualizarGrafico() {
    const ctx = document.getElementById("graficoLucro").getContext("2d");

    const labels = produtos.map((p) => p.nome);
    const lucroData = produtos.map((p) => p.montante - p.investimento);

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = lucroData;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Lucro (Montante - Investimento)",
                        data: lucroData,
                        backgroundColor: "rgba(75, 192, 192, 0.6)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }
}

// Exportar para Excel (CSV simples)
function exportarParaExcel() {
    if (produtos.length === 0) {
        alert("Nenhum produto para exportar.");
        return;
    }

    const cabecalho = [
        "Nome",
        "Cor",
        "Quantidade",
        "Embalagem (R$)",
        "Valor PDV (R$)",
        "Investimento (R$)",
        "Montante (R$)",
    ];
    const linhas = produtos.map((p) => [
        p.nome,
        p.cor,
        p.quantidade,
        p.embalagem.toFixed(2),
        p.valorpdv.toFixed(2),
        p.investimento.toFixed(2),
        p.montante.toFixed(2),
    ]);

    let csvContent = cabecalho.join(";") + "\n" + linhas.map((l) => l.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "estoque_carambola.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function cancelarEdicao() {
    limparFormulario();
}

function configurarAbas() {
    btnCadastro.addEventListener("click", () => {
        mostrarAba("cadastro");
    });
    btnVisualizar.addEventListener("click", () => {
        mostrarAba("visualizar");
    });
    btnGrafico.addEventListener("click", () => {
        mostrarAba("grafico");
    });
}

function mostrarAba(nomeAba) {
    Object.keys(abas).forEach((aba) => {
        // Mostra/esconde a aba
        abas[aba].classList.toggle("hidden", aba !== nomeAba);
    });

    // Remove destaque de todos os botões
    [btnCadastro, btnVisualizar, btnGrafico].forEach((btn) =>
        btn.classList.remove("aba-ativa")
    );

    // Aplica destaque no botão correspondente
    if (nomeAba === "cadastro") btnCadastro.classList.add("aba-ativa");
    if (nomeAba === "visualizar") btnVisualizar.classList.add("aba-ativa");
    if (nomeAba === "grafico") btnGrafico.classList.add("aba-ativa");

    if (nomeAba === "visualizar") atualizarTabela();
    if (nomeAba === "grafico") atualizarGrafico();
}


// Ouve alterações em tempo real no Firestore e atualiza array e interface
function escutarProdutos() {
    const q = query(collection(db, "produtos"), orderBy("nome", "asc"));
    onSnapshot(q, (querySnapshot) => {
        produtos = [];
        querySnapshot.forEach((doc) => {
            produtos.push({ id: doc.id, ...doc.data() });
        });
        atualizarTabela();
        atualizarGrafico();
    });
}

// Filtro de busca em tempo real
document.getElementById("filtroBusca").addEventListener("input", function () {
    const termoBusca = this.value.toLowerCase();
    const linhas = document.querySelectorAll("#tabelaProdutos tr");

    linhas.forEach((linha) => {
        const nomeProduto = linha.querySelector("td")?.textContent?.toLowerCase() || "";
        if (nomeProduto.includes(termoBusca)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }
    });
});


filtroBusca.addEventListener("input", atualizarTabela);
formProduto.addEventListener("submit", salvarProduto);
cancelarEdicaoBtn.addEventListener("click", cancelarEdicao);
btnExportar.addEventListener("click", exportarParaExcel);
["embalagem", "investimento", "quantidade"].forEach((id) => {
    document.getElementById(id).addEventListener("input", calcularMontanteAutomaticamente);
});

configurarAbas();
mostrarAba("visualizar");
escutarProdutos();
