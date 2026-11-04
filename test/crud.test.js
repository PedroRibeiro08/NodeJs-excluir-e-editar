const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const app = require('../server');

test('CRUD completo para cada entidade e validação dos dados', async t => {
    const server = app.listen(0);
    await once(server, 'listening');
    t.after(() => new Promise(resolve => server.close(resolve)));

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const entidades = [
        ['clientes', { nome: 'Pessoa de teste', email: 'teste@example.com', telefone: '11999990000' }],
        ['fornecedores', { nome: 'Fornecedor de teste', email: 'fornecedor@example.com', telefone: '1133330000' }],
        ['produtos', { nome: 'Produto de teste', preco: '19.9', quantidade: '4' }]
    ];

    for (const [rota, valores] of entidades) {
        const listaInicial = await fetch(`${baseUrl}/${rota}`);
        assert.equal(listaInicial.status, 200);
        assert.match(await listaInicial.text(), /Nenhum registro cadastrado/);

        const cadastro = await fetch(`${baseUrl}/${rota}/criar`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(valores),
            redirect: 'manual'
        });
        assert.equal(cadastro.status, 302);

        const lista = await fetch(`${baseUrl}/${rota}`);
        const htmlLista = await lista.text();
        assert.equal(lista.status, 200);
        assert.match(htmlLista, new RegExp(valores.nome));
        if (valores.email) assert.match(htmlLista, new RegExp(valores.email));

        const id = htmlLista.match(new RegExp(`/editar/([a-f0-9-]+)`))[1];
        const telaEdicao = await fetch(`${baseUrl}/${rota}/editar/${id}`);
        assert.equal(telaEdicao.status, 200);

        const atualizado = { ...valores, nome: `${valores.nome} atualizado` };
        const edicao = await fetch(`${baseUrl}/${rota}/editar/${id}`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(atualizado),
            redirect: 'manual'
        });
        assert.equal(edicao.status, 302);
        assert.match(await (await fetch(`${baseUrl}/${rota}`)).text(), new RegExp(atualizado.nome));

        const exclusao = await fetch(`${baseUrl}/${rota}/excluir/${id}`, {
            method: 'POST',
            redirect: 'manual'
        });
        assert.equal(exclusao.status, 302);
        assert.match(await (await fetch(`${baseUrl}/${rota}`)).text(), /Nenhum registro cadastrado/);
    }

    const produtoInvalido = await fetch(`${baseUrl}/produtos/criar`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ nome: 'Produto sem preço', preco: '-1', quantidade: '2' })
    });
    assert.equal(produtoInvalido.status, 400);
    assert.match(await produtoInvalido.text(), /preço deve ser um número/);
});