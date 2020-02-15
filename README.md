# Visualise SPARQL responses

[![Build Status](https://travis-ci.com/Daru13/semantic-web-visualisation.svg?token=k9rdEMrtfsRy2L9s8psg&branch=master)](https://travis-ci.com/Daru13/semantic-web-visualisation)

This project is an attempt to better **visualise semantic web data**.
More specifically, it was designed to process the **results of SPARQL queries** (_e.g._ from [dpbedia](https://dbpedia.org/sparql)), _i.e._ tables containing **lots of URIs**.

The interface contains two complementary parts:

- Per-column **dashboards** containing basics statistics (_e.g_ most common URL domains), keywords, and visualisations of the structures of the URLs (using a [Sankey diagram](https://en.wikipedia.org/wiki/Sankey_diagram));
- A table containing the entire result of the SPARQL query split into pages with a simplified representation of URLs.

📊 **[ONLINE DEMO](https://daru13.github.io/semantic-web-visualisation/demo/)** 



## Project organisation

The project is written in **TypeScript** (with some HTML and CSS for the presentation part).
It has **no runtime dependency** (DOM manipulation is done using vanilla JS).

The build process uses [Rollup](https://rollupjs.org/guide/en/) to bundle the transpiled TypeScript files.

// TODO



## Build instructions

We use [`yarn`](http://yarnpkg.com) to manage the develoment dependencies and to run scripts, but it should work fine using your favourite package manager for JavaScript (such as `npm`).

Run the following commands to create your own build:
- `yarn` will install the devlopment dependencies
- `yarn build` will compile and bundle TypeScript sources into the `build` folder

Note that the HTML and the CSS files are not processed by Rollup. They are located in the `demo` directory.
You can also run `yarn watch` to start Rollup in watch mode (_i.e._ automatically recompile the sources when they change).