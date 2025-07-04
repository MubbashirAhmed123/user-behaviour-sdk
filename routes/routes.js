import Fastify from "fastify";

const app = Fastify({ logger: true });


export const routes = async (app) => {
    app.get('/app', async (req, res) => {
        res.send('hello')
    })
}