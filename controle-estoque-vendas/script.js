let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let comandasAtivas = JSON.parse(localStorage.getItem("comandasAtivas")) || [];
let comandaAtualIndex = null;

function mostrarTela(tela) {
  const conteudo = document.getElementById("conteudo");

  if (tela === "produtos") {
    conteudo.innerHTML = `
      <h2>📦 Produtos</h2>
      <form onsubmit="adicionarProduto(event)">
        <input type="text" id="nome-produto" placeholder="Nome" required>
        <input type="number" id="preco-produto" placeholder="Preço" required>
        <input type="number" id="estoque-produto" placeholder="Estoque" required>
        <button type="submit">+ Adicionar Produto</button>
      </form>
      <table>
        <tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr>
        ${produtos.map((p, i) => `
          <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.preco}</td>
            <td>${p.estoque}</td>
            <td>
              <button onclick="editarProduto(${i})">✏️</button>
              <button onclick="excluirProduto(${i})">🗑️</button>
            </td>
          </tr>
        `).join("")}
      </table>
    `;
  }

  if (tela === "comandas") {
    conteudo.innerHTML = `
      <h2>🧾 Comandas</h2>
      <button onclick="novaComanda()">+ Nova Comanda</button>
      <button onclick="vendaRapida()">💳 Venda Rápida</button>
      <ul>
        ${comandasAtivas.map((comanda, i) => `
          <li><button onclick="abrirComanda(${i})">${comanda.nome}</button></li>
        `).join("")}
      </ul>
    `;
  }

  if (tela === "vendas") {
    const vendas = JSON.parse(localStorage.getItem("historicoVendas")) || [];

    conteudo.innerHTML = `
      <h2>📜 Vendas</h2>
      <table>
        <tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Ação</th></tr>
        ${vendas.map((v, i) => `
          <tr>
            <td>${v.data}</td>
            <td>${v.nome}</td>
            <td>${v.itens.map(item => {
              const p = produtos[item.produto];
              return `${p?.nome || "?"} (x${item.quantidade})`;
            }).join(", ")}</td>
            <td>R$ ${v.total.toFixed(2)}</td>
            <td><button onclick="excluirVenda(${i})">🗑</button></td>
          </tr>
        `).join("")}
      </table>
    `;
  }
}

function adicionarProduto(event) {
  event.preventDefault();
  const nome = document.getElementById("nome-produto").value;
  const preco = parseFloat(document.getElementById("preco-produto").value);
  const estoque = parseInt(document.getElementById("estoque-produto").value);

  produtos.push({ nome, preco, estoque });
  localStorage.setItem("produtos", JSON.stringify(produtos));
  mostrarTela("produtos");
}

function editarProduto(index) {
  const produto = produtos[index];
  const novoNome = prompt("Novo nome:", produto.nome);
  const novoPreco = parseFloat(prompt("Novo preço:", produto.preco));
  const novoEstoque = parseInt(prompt("Novo estoque:", produto.estoque));

  if (novoNome && !isNaN(novoPreco) && !isNaN(novoEstoque)) {
    produtos[index] = {
      nome: novoNome,
      preco: novoPreco,
      estoque: novoEstoque
    };
    localStorage.setItem("produtos", JSON.stringify(produtos));
    mostrarTela("produtos");
  }
}

function excluirProduto(index) {
  if (confirm("Excluir este produto?")) {
    produtos.splice(index, 1);
    localStorage.setItem("produtos", JSON.stringify(produtos));
    mostrarTela("produtos");
  }
}

function novaComanda() {
  const nome = prompt("Nome da comanda:");
  if (!nome) return;

  comandasAtivas.push({ nome, itens: [] });
  salvarComandasAtivas();
  mostrarTela("comandas");
}

function abrirComanda(index) {
  comandaAtualIndex = index;
  const comanda = comandasAtivas[index];
  const itens = comanda.itens;

  const conteudo = document.getElementById("conteudo");
  conteudo.innerHTML = `
    <h2>🧾 Comanda: ${comanda.nome}</h2>
    <form onsubmit="finalizarComanda(event)">
      <div id="itens-comanda">
        ${itens.map((item, i) => `
          <div>
            <select onchange="selecionarProdutoComanda(${i}, this.value)">
              <option value="">-- Produto --</option>
              ${produtos.map((p, j) => `
                <option value="${j}" ${item.produto === j ? "selected" : ""}>${p.nome}</option>
              `).join("")}
            </select>
            <input type="number" min="1" value="${item.quantidade}" onchange="atualizarQtdComanda(${i}, this.value)">
            <span>Subtotal: R$ ${(produtos[item.produto]?.preco * item.quantidade || 0).toFixed(2)}</span>
            <button type="button" onclick="removerItemComanda(${i})">❌</button>
          </div>
        `).join("")}
      </div>
      <button type="button" onclick="adicionarItemNaComanda()">+ Adicionar Item</button><br><br>
      <strong>Total: R$ <span id="total-comanda">${calcularTotal(itens).toFixed(2)}</span></strong><br><br>
      <button type="submit">💰 Finalizar Comanda</button>
    </form>
  `;
}

function selecionarProdutoComanda(i, valor) {
  comandasAtivas[comandaAtualIndex].itens[i].produto = parseInt(valor);
  salvarComandasAtivas();
  abrirComanda(comandaAtualIndex);
}

function atualizarQtdComanda(i, valor) {
  comandasAtivas[comandaAtualIndex].itens[i].quantidade = parseInt(valor);
  salvarComandasAtivas();
  abrirComanda(comandaAtualIndex);
}

function removerItemComanda(index) {
  comandasAtivas[comandaAtualIndex].itens.splice(index, 1);
  salvarComandasAtivas();
  abrirComanda(comandaAtualIndex);
}

function adicionarItemNaComanda() {
  comandasAtivas[comandaAtualIndex].itens.push({ produto: null, quantidade: 1 });
  salvarComandasAtivas();
  abrirComanda(comandaAtualIndex);
}

function calcularTotal(itens) {
  return itens.reduce((total, item) => {
    const produto = produtos[item.produto];
    return total + (produto ? produto.preco * item.quantidade : 0);
  }, 0);
}

function finalizarComanda(event) {
  event.preventDefault();

  const comanda = comandasAtivas[comandaAtualIndex];
  const itens = comanda.itens;

  for (let item of itens) {
    if (item.produto === null) {
      alert("Selecione todos os produtos.");
      return;
    }
  }

  for (let item of itens) {
    const produto = produtos[item.produto];
    if (produto.estoque < item.quantidade) {
      alert(`Estoque insuficiente para: ${produto.nome}`);
      return;
    }
  }

  for (let item of itens) {
    produtos[item.produto].estoque -= item.quantidade;
  }

  localStorage.setItem("produtos", JSON.stringify(produtos));

  let vendas = JSON.parse(localStorage.getItem("historicoVendas")) || [];
  vendas.push({
    nome: comanda.nome,
    itens,
    total: calcularTotal(itens),
    data: new Date().toLocaleString()
  });
  localStorage.setItem("historicoVendas", JSON.stringify(vendas));

  comandasAtivas.splice(comandaAtualIndex, 1);
  salvarComandasAtivas();
  mostrarTela("comandas");
}

function salvarComandasAtivas() {
  localStorage.setItem("comandasAtivas", JSON.stringify(comandasAtivas));
}

function excluirVenda(index) {
  if (confirm("Deseja excluir essa venda?")) {
    let vendas = JSON.parse(localStorage.getItem("historicoVendas")) || [];
    vendas.splice(index, 1);
    localStorage.setItem("historicoVendas", JSON.stringify(vendas));
    mostrarTela("vendas");
  }
}

function vendaRapida() {
  const nome = prompt("Nome do cliente:");
  if (!nome) return;

  comandasAtivas.push({ nome, itens: [] });
  comandaAtualIndex = comandasAtivas.length - 1;
  abrirComanda(comandaAtualIndex);
}
        