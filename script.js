// script.js

let produtos = [];
let editandoIndex = -1;
let ordemAtual = { coluna: null, crescente: true };

const formProduto = document.getElementById('formProduto');
const tabelaProdutos = document.getElementById('tabelaProdutos');
const filtroBusca = document.getElementById('filtroBusca');
const mensagemSucesso = document.getElementById('mensagemSucesso');
const cancelarEdicaoBtn = document.getElementById('cancelarEdicaoBtn');

const abas = {
    cadastro: document.getElementById('abaCadastro'),
    visualizar: document.getElementById('abaVisualizar'),
    grafico: document.getElementById('abaGrafico'),
};

const btnCadastro = document.getElementById('abaCadastroBtn');
const btnVisualizar = document.getElementById('abaVisualizarBtn');
const btnGrafico = document.getElementById('abaGraficoBtn');
const btnExportar = document.getElementById('exportarBtn');

const campos = ['nome', 'cor', 'quantidade', 'embalagem', 'valorpdv', 'investimento', 'montante'];

function mostrarMensagem(msg) {
    mensagemSucesso.textContent = msg;
    mensagemSucesso.classList.remove('hidden');
    setTimeout(() => mensagemSucesso.classList.add('hidden'), 3000);
}

function limparFormulario() {
    campos.forEach(campo => {
        document.getElementById(campo).value = '';
    });
    editandoIndex = -1;
    cancelarEdicaoBtn.classList.add('hidden');
}

function salvarProduto(event) {
    event.preventDefault();

    const novoProduto = {};
    for (const campo of campos) {
        const input = document.getElementById(campo);
        if (input.type === 'number') {
            novoProduto[campo] = parseFloat(input.value);
        } else {
            novoProduto[campo] = input.value.trim();
        }
    }

    if (editandoIndex >= 0) {
        produtos[editandoIndex] = novoProduto;
        mostrarMensagem('Produto atualizado com sucesso!');
    } else {
        produtos.push(novoProduto);
        mostrarMensagem('Produto salvo com sucesso!');
    }

    limparFormulario();
    atualizarTabela();
    atualizarGrafico();
}

function atualizarTabela() {
    const filtro = filtroBusca.value.toLowerCase();
    let produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(filtro));

    if (ordemAtual.coluna) {
        produtosFiltrados.sort((a, b) => {
            if (a[ordemAtual.coluna] < b[ordemAtual.coluna]) return ordemAtual.crescente ? -1 : 1;
            if (a[ordemAtual.coluna] > b[ordemAtual.coluna]) return ordemAtual.crescente ? 1 : -1;
            return 0;
        });
    }

    tabelaProdutos.innerHTML = '';

    produtosFiltrados.forEach((produto, i) => {
        const tr = document.createElement('tr');
        tr.classList.add(i % 2 === 0 ? 'bg-white' : 'bg-orange-50');
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
      </td>
    `;
        tabelaProdutos.appendChild(tr);

        tr.querySelector('.editarBtn').addEventListener('click', () => editarProduto(produto));
        tr.querySelector('.excluirBtn').addEventListener('click', () => excluirProduto(produto));
    });
}

function editarProduto(produto) {
    editandoIndex = produtos.indexOf(produto);
    campos.forEach(campo => {
        document.getElementById(campo).value = produto[campo];
    });
    cancelarEdicaoBtn.classList.remove('hidden');
    btnCadastro.click();
}

function excluirProduto(produto) {
    const index = produtos.indexOf(produto);
    if (index >= 0) {
        if (confirm(`Deseja realmente excluir o produto "${produto.nome}"?`)) {
            produtos.splice(index, 1);
            atualizarTabela();
            atualizarGrafico();
            mostrarMensagem('Produto excluído com sucesso!');
        }
    }
}

function cancelarEdicao() {
    limparFormulario();
}

function configurarAbas() {
    btnCadastro.addEventListener('click', () => {
        mostrarAba('cadastro');
    });
    btnVisualizar.addEventListener('click', () => {
        mostrarAba('visualizar');
    });
    btnGrafico.addEventListener('click', () => {
        mostrarAba('grafico');
    });
}

function mostrarAba(nomeAba) {
    Object.keys(abas).forEach(aba => {
        abas[aba].classList.toggle('hidden', aba !== nomeAba);
    });

    // Atualiza tabela ou gráfico ao mostrar
    if (nomeAba === 'visualizar') {
        atualizarTabela();
    }
    if (nomeAba === 'grafico') {
        atualizarGrafico();
    }
}

filtroBusca.addEventListener('input', atualizarTabela);
formProduto.addEventListener('submit', salvarProduto);
cancelarEdicaoBtn.addEventListener('click', cancelarEdicao);
btnExportar.addEventListener('click', exportarParaExcel);

configurarAbas();
mostrarAba('cadastro');

// Ordenação da tabela
document.querySelectorAll('#abaVisualizar thead th.cursor-pointer').forEach(th => {
    th.addEventListener('click', () => {
        const coluna = th.dataset.col;
        if (ordemAtual.coluna === coluna) {
            ordemAtual.crescente = !ordemAtual.crescente;
        } else {
            ordemAtual.coluna = coluna;
            ordemAtual.crescente = true;
        }
        atualizarTabela();
    });
});

// Gráfico
let chart;

function atualizarGrafico() {
    const ctx = document.getElementById('graficoLucro').getContext('2d');

    const labels = produtos.map(p => p.nome);
    const lucroData = produtos.map(p => p.montante - p.investimento);

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = lucroData;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lucro (Montante - Investimento)',
                    data: lucroData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Exportar para Excel (CSV simples)
function exportarParaExcel() {
    if (produtos.length === 0) {
        alert('Nenhum produto para exportar.');
        return;
    }

    const cabecalho = ['Nome', 'Cor', 'Quantidade', 'Embalagem (R$)', 'Valor PDV (R$)', 'Investimento (R$)', 'Montante (R$)'];
    const linhas = produtos.map(p => [
        p.nome,
        p.cor,
        p.quantidade,
        p.embalagem.toFixed(2),
        p.valorpdv.toFixed(2),
        p.investimento.toFixed(2),
        p.montante.toFixed(2)
    ]);

    let csvContent = cabecalho.join(';') + '\n' + linhas.map(l => l.join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'estoque_carambola.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

atualizarTabela();

