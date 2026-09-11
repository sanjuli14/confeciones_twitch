/**
 * Vercel Serverless Function entry point for Angular SSR.
 * Forwards every request to Angular's compiled SSR request handler.
 */
export const dynamic = 'force-dynamic';

const { reqHandler } = await import(
  '../dist/confeciones_twitch/server/server.mjs'
);

export default reqHandler;