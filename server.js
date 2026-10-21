const express = require('express');
const app = express();
const PORT = 3000;

const nomesDupla = ['Pedro Henrique Ribeiro Oliveira dos Santos'];

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const entidades = {
    clientes: {
        titulo: 'Clientes',
        campos: ['nome', 'email', 'telefone'],
        dados: []
    },
    fornecedores: {
        titulo: 'Fornecedores',
        campos: ['nome', 'email', 'telefone'],
        dados: []
    },
    produtos: {
        titulo: 'Produtos',
        campos: ['nome', 'preco', 'quantidade'],
        dados: []
    }
};

app.get('/', (req, res) => {
    res.render('index', { nomesDupla });
});

Object.entries(entidades).forEach(([rota, entidade]) => {
    app.get(`/${rota}`, (req, res) => {
        res.render(`${rota}/index`, {
            titulo: entidade.titulo,
            dados: entidade.dados,
            campos: entidade.campos,
            rota
        });
    });

    app.get(`/${rota}/criar`, (req, res) => {
        res.render(`${rota}/criar`, {
            titulo: entidade.titulo,
            campos: entidade.campos,
            rota
        });
    });

    app.post(`/${rota}/criar`, (req, res) => {
        const registro = {
            id: Date.now() + Math.random(),
            ...Object.fromEntries(
                entidade.campos.map(campo => [campo, req.body[campo] || ''])
            )
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
            registro
        });
    });

    app.post(`/${rota}/editar/:id`, (req, res) => {
        const registro = entidade.dados.find(
            item => String(item.id) === req.params.id
        );
        if (!registro) {
            return res.status(404).send('Registro não encontrado.');
        }
        entidade.campos.forEach(campo => {
            registro[campo] = req.body[campo] || '';
        });
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

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
