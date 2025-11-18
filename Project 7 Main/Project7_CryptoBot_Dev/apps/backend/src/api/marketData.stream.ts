import { FastifyPluginAsync } from 'fastify';

const plugin: FastifyPluginAsync = async (app) => {
  app.get('/api/market/stream', (req, res) => {
    res.raw.setHeader('Content-Type', 'text/event-stream');
    res.raw.setHeader('Cache-Control', 'no-cache');
    res.raw.setHeader('Connection', 'keep-alive');
    res.raw.flushHeaders();

    const writePing = () => {
      res.raw.write(`event: ping\ndata: {}\n\n`);
    };

    writePing();
    const interval = setInterval(writePing, 15_000);

    req.raw.once('close', () => {
      clearInterval(interval);
    });
  });
};

export default plugin;
