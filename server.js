const express = require('express');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const app = express();
const PORT = 3000;

const nomesDupla = ['Pedro Henrique Ribeiro Oliveira dos Santos'];

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const entidades = {
    clientes: {
        titulo: 'Clientes',
        campos: ['nome', 'email', 'telefone'],
        obrigatorios: ['nome', 'email'],
        dados: []
    },
    fornecedores: {
        titulo: 'Fornecedores',
        campos: ['nome', 'email', 'telefone'],
        obrigatorios: ['nome', 'email'],
        dados: []
    },
    produtos: {
        titulo: 'Produtos',
        campos: ['nome', 'preco', 'quantidade'],
        obrigatorios: ['nome', 'preco', 'quantidade'],
        dados: []
    }
};

function lerRegistro(entidade, body) {
    const valores = Object.fromEntries(
        entidade.campos.map(campo => [campo, String(body[campo] ?? '').trim()])
    );

    if (entidade.obrigatorios.some(campo => !valores[campo])) {
        return { erro: 'Preencha todos os campos obrigatórios.' };
    }
    if (valores.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) {
        return { erro: 'Informe um endereço de e-mail válido.' };
    }
    if (valores.preco !== undefined && (!Number.isFinite(Number(valores.preco)) || Number(valores.preco) < 0)) {
        return { erro: 'O preço deve ser um número igual ou maior que zero.' };
    }
    if (valores.quantidade !== undefined && (!/^\d+$/.test(valores.quantidade) || Number(valores.quantidade) < 0)) {
        return { erro: 'A quantidade deve ser um número inteiro igual ou maior que zero.' };
    }

    return { valores };
}

app.get('/', (req, res) => {
    const resumo = Object.entries(entidades).map(([rota, entidade]) => ({
        rota,
        titulo: entidade.titulo,
        total: entidade.dados.length
    }));
    res.render('index', { nomesDupla, resumo });
});

Object.entries(entidades).forEach(([rota, entidade]) => {
    app.get(`/${rota}`, (req, res) => {
        res.render(`${rota}/index`, {
            titulo: entidade.titulo,
            dados: entidade.dados,
            campos: entidade.campos,
            rotulos: { nome: 'Nome', email: 'E-mail', telefone: 'Telefone', preco: 'Preço', quantidade: 'Quantidade' },
            rota
        });
    });

    app.get(`/${rota}/criar`, (req, res) => {
        res.render(`${rota}/criar`, {
            titulo: entidade.titulo,
            campos: entidade.campos,
            rota,
            erro: null,
            valores: Object.fromEntries(entidade.campos.map(campo => [campo, '']))
        });
    });

    app.post(`/${rota}/criar`, (req, res) => {
        const resultado = lerRegistro(entidade, req.body);
        if (resultado.erro) {
            return res.status(400).render(`${rota}/criar`, {
                titulo: entidade.titulo,
                campos: entidade.campos,
                rota,
                erro: resultado.erro,
                valores: req.body
            });
        }
        const registro = {
            id: randomUUID(),
            ...resultado.valores
        };
        entidade.dados.push(registro);
        res.redirect(`/${rota}`);
    });

    app.get(`/${rota}/editar/:id`, (req, res) => {
        const registro = entidade.dados.find(
            item => String(item.id) === req.params.id
        );
        if (!registro) {
            return res.status(404).send('Registro não encontrado.');
        }
        res.render(`${rota}/editar`, {
            titulo: entidade.titulo,
            campos: entidade.campos,
            rota,
            registro,
            erro: null
        });
    });

    app.post(`/${rota}/editar/:id`, (req, res) => {
        const registro = entidade.dados.find(
            item => String(item.id) === req.params.id
        );
        if (!registro) {
            return res.status(404).send('Registro não encontrado.');
        }
        const resultado = lerRegistro(entidade, req.body);
        if (resultado.erro) {
            return res.status(400).render(`${rota}/editar`, {
                titulo: entidade.titulo,
                campos: entidade.campos,
                rota,
                registro: { ...registro, ...req.body },
                erro: resultado.erro
            });
        }
        Object.assign(registro, resultado.valores);
        res.redirect(`/${rota}`);
    });

    app.post(`/${rota}/excluir/:id`, (req, res) => {
        const indice = entidade.dados.findIndex(
            item => String(item.id) === req.params.id
        );
        if (indice === -1) {
            return res.status(404).send('Registro não encontrado.');
        }
        entidade.dados.splice(indice, 1);
        res.redirect(`/${rota}`);
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
