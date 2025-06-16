let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let editIndex = -1;
let ordemAtual = { coluna: null, asc: true };

const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const filtroBusca = document.getElementById("filtroBusca");
const abaCadastroBtn = document.getElementById("abaCadastroBtn");
const abaVisualizarBtn = document.getElementById("abaVisualizarBtn");
const abaGraficoBtn = document.getElementById("abaGraficoBtn");
const abaCadastro = document.getElementById("abaCadastro");
const abaVisualizar = document.getElementById("abaVisualizar");
const abaGrafico = document.getElementById("abaGrafico");
const cancelarEdicaoBtn = document.getElementById("cancelarEdicaoBtn");
const mensagemSucesso = document.getElementById("mensagemSucesso");
const graficoLucro = document.getElementById("graficoLucro");
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDtKKeamDkDcT_0bGp79PNnZ1k_ThaCyhk",
    authDomain: "estoquecarambola2.firebaseapp.com",
    projectId: "estoquecarambola2",
    storageBucket: "estoquecarambola2.firebasestorage.app",
    messagingSenderId: "381269040819",
    appId: "1:381269040819:web:86b389b25a70b7f8329ac6",
    measurementId: "G-WBETYR66TP"
};

function mostrarMensagem(texto) {
    mensagemSucesso.textContent = texto;
    mensagemSucesso.classList.remove("hidden");
    setTimeout(() => mensagemSucesso.classList.add("hidden"), 3000);
}

function atualizarTabela(filtro = "") {
    tabelaProdutos.innerHTML = "";
    let produtosFiltrados = produtos.filter(produto => produto.nome.toLowerCase().includes(filtro.toLowerCase()));

    if (ordemAtual.coluna) {
        produtosFiltrados.sort((a, b) => {
            let valA = a[ordemAtual.coluna];
            let valB = b[ordemAtual.coluna];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            if (valA < valB) return ordemAtual.asc ? -1 : 1;
            if (valA > valB) return ordemAtual.asc ? 1 : -1;
            return 0;
        });
    }

    produtosFiltrados.forEach((produto, index) => {
        tabelaProdutos.innerHTML += `
      <tr>
        <td class="p-2 border border-orange-200">${produto.nome}</td>
        <td class="p-2 border border-orange-200">${produto.cor}</td>
        <td class="p-2 border border-orange-200">${produto.quantidade}</td>
        <td class="p-2 border border-orange-200">R$ ${produto.embalagem.toFixed(2)}</td>
        <td class="p-2 border border-orange-200">R$ ${produto.valorpdv.toFixed(2)}</td>
        <td class="p-2 border border-orange-200">R$ ${produto.investimento.toFixed(2)}</td>
        <td class="p-2 border border-orange-200">R$ ${produto.montante.toFixed(2)}</td>
        <td class="p-2 border border-orange-200 space-x-2">
          <button onclick="editarProduto(${index})" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Editar</button>
          <button onclick="darBaixa(${index})" class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">Baixa</button>
          <button onclick="removerProduto(${index})" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Remover</button>
        </td>
      </tr>
    `;
    });
}

function salvarProdutos() {
   firebase.firestore().collection("produtos").add(produto);

}

formProduto.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const cor = document.getElementById("cor").value;
    const quantidade = parseInt(document.getElementById("quantidade").value);
    const embalagem = parseFloat(document.getElementById("embalagem").value);
    const valorpdv = parseFloat(document.getElementById("valorpdv").value);
    const investimento = parseFloat(document.getElementById("investimento").value);
    const montante = parseFloat(document.getElementById("montante").value);

    const produto = { nome, cor, quantidade, embalagem, valorpdv, investimento, montante };

    if (editIndex === -1) {
        produtos.push(produto);
        mostrarMensagem("Produto adicionado com sucesso!");
    } else {
        produtos[editIndex] = produto;
        editIndex = -1;
        cancelarEdicaoBtn.classList.add("hidden");
        mostrarMensagem("Produto editado com sucesso!");
    }

    salvarProdutos();
    atualizarTabela(filtroBusca.value);
    formProduto.reset();
});

filtroBusca.addEventListener("input", (e) => atualizarTabela(e.target.value));

cancelarEdicaoBtn.addEventListener("click", () => {
    editIndex = -1;
    formProduto.reset();
    cancelarEdicaoBtn.classList.add("hidden");
});

function editarProduto(index) {
    const produto = produtos[index];
    document.getElementById("nome").value = produto.nome;
    document.getElementById("cor").value = produto.cor;
    document.getElementById("quantidade").value = produto.quantidade;
    document.getElementById("embalagem").value = produto.embalagem;
    document.getElementById("valorpdv").value = produto.valorpdv;
    document.getElementById("investimento").value = produto.investimento;
    document.getElementById("montante").value = produto.montante;
    editIndex = index;
    cancelarEdicaoBtn.classList.remove("hidden");
    abaCadastroBtn.click();
}

function darBaixa(index) {
    const quantidadeSaida = prompt("Digite a quantidade a dar baixa:");
    const qtd = parseInt(quantidadeSaida);
    if (!isNaN(qtd) && qtd > 0 && produtos[index].quantidade >= qtd) {
        produtos[index].quantidade -= qtd;
        salvarProdutos();
        atualizarTabela(filtroBusca.value);
        mostrarMensagem("Baixa realizada com sucesso!");
    } else {
        alert("Quantidade inválida!");
    }
}

function removerProduto(index) {
    if (confirm("Deseja remover este produto?")) {
        produtos.splice(index, 1);
        salvarProdutos();
        atualizarTabela(filtroBusca.value);
        mostrarMensagem("Produto removido com sucesso!");
    }
}

abaCadastroBtn.addEventListener("click", () => {
    abaCadastro.classList.remove("hidden");
    abaVisualizar.classList.add("hidden");
    abaGrafico.classList.add("hidden");
});

abaVisualizarBtn.addEventListener("click", () => {
    abaCadastro.classList.add("hidden");
    abaVisualizar.classList.remove("hidden");
    abaGrafico.classList.add("hidden");
    atualizarTabela(filtroBusca.value);
});

abaGraficoBtn.addEventListener("click", () => {
    abaCadastro.classList.add("hidden");
    abaVisualizar.classList.add("hidden");
    abaGrafico.classList.remove("hidden");
    atualizarGrafico();
});

function atualizarGrafico() {
    const labels = produtos.map(p => p.nome);
    const dados = produtos.map(p => p.montante);

    new Chart(graficoLucro, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Montante por Produto',
                data: dados,
                backgroundColor: 'rgba(255, 165, 0, 0.6)',
                borderColor: 'orange',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `Montante: R$ ${ctx.raw.toFixed(2)}` } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Montante (R$)' }
                },
                x: {
                    title: { display: true, text: 'Produto' }
                }
            }
        }
    });
}

document.querySelectorAll("th[data-col]").forEach(th => {
    th.addEventListener("click", () => {
        const coluna = th.getAttribute("data-col");
        if (ordemAtual.coluna === coluna) {
            ordemAtual.asc = !ordemAtual.asc;
        } else {
            ordemAtual.coluna = coluna;
            ordemAtual.asc = true;
        }
        atualizarTabela(filtroBusca.value);
    });
});

atualizarTabela();

