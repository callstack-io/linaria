/* @flow */
/* linaria-preval */
import fs from 'fs';
import path from 'path';
import express from 'express';
import crypto from 'crypto';
import dedent from 'dedent';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { collect } from 'linaria/server';
import App from './App';

const cache = {};
const css = fs.readFileSync('./static/styles.css', 'utf8');
const app = express();

app.get('/', (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);
  const { critical, other } = collect(html, css);
  const slug = crypto
    .createHash('md5')
    .update(other)
    .digest('hex');

  cache[slug] = other;

  res.end(dedent`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Linaria – zero-runtime CSS in JS library</title>
        <style type="text/css">${critical}</style>
        <script defer src="/build/manifest.js"></script>
        <script defer src="/build/vendor.js"></script>
        <script defer src="/build/main.js"></script>
      </head>
      <body>
        <div id="root">${html}</div>
        <link rel="stylesheet" href="/vendor/prism.css">
        <link rel="stylesheet" href="/styles/${slug}" />
      </body>
    </html>
  `);
});

app.get('/styles/:slug', (req, res) => {
  res.type('text/css');
  res.end(cache[req.params.slug]);
});
app.get('/build/:slug', (req, res) => {
  res.end(fs.readFileSync(path.resolve('static', 'build', req.params.slug)));
});
app.get('/vendor/:slug', (req, res) => {
  res.type('text/css');
  res.end(fs.readFileSync(path.resolve('static', 'vendor', req.params.slug)));
});
app.get('/images/:slug', (req, res) => {
  res.end(fs.readFileSync(path.resolve('static', 'images', req.params.slug)));
});
app.listen(3242);
