const fs    = require('fs');
const fetch = require('node-fetch');

const camelCase = require('lodash.camelcase');
const kebabCase = require('lodash.kebabcase');
const snakeCase = require('lodash.snakecase');
const tinycolor = require('tinycolor2');

const figmaURL   = 'https://api.figma.com/v1/files/';
const templates  = require('./templates');


class fibi {
  constructor() {
    this.accessToken = null;
    this.figmaId     = null;
    this.templates   = templates;
    this.files       = [];
  }

  setAccessToken(token) {
    this.accessToken = token;

    return this;
  }

  setFigmaId(link) {
    this.figmaId = link;

    return this;
  }

  addFile(file) {
    this.files.push(file);

    return this;
  }

  async getTokens() {
    if (!this.accessToken) throw new Error('access token has not been set');
    if (!this.figmaId) throw new Error('figma ID has not been set');

    const result = await fetch(figmaURL + this.figmaId, {
      method: "GET",
      headers: {
        "X-Figma-Token": this.accessToken
      }
    });

    const figmaTreeStructure = await result.json();

    return this.parseTokens(figmaTreeStructure.document.children);
  }

  parseTokens(pages) {
    const tokens = [];

    pages.forEach(page => {
      page.children.forEach(artboard => {

        if (artboard.name[0] === '_') return;
        artboard.children.forEach(group => {

          if (group.type !== 'GROUP') return;
          group.children.forEach(layer => {

            if (layer.name[0] !== '$') return;
            const formatted = this.formatToken(layer, group.name);
            if (formatted) tokens.push(formatted);
          });
        });
      })
    });

    return tokens;
  }

  formatToken(layer, type) {
    const { name, style } = layer;
    const defaultToken = {
      name: name.replace('$', ''),
      type: type
    };

    switch (type) {
      case "Colors":
        return Object.assign(defaultToken, {
          color: tinycolor.fromRatio({
            r: layer.fills[0].color.r,
            g: layer.fills[0].color.g,
            b: layer.fills[0].color.b,
            a: layer.fills[0].color.a,
          })
        });
      
      case "Typography":
        return Object.assign(defaultToken, {
          fontFamily   : style.fontFamily,
          fontSize     : style.fontSize,
          fontWeight   : style.fontWeight,
          lineHeight   : style.lineHeightPx,
          letterSpacing: style.letterSpacing
        });

      case "Spacings":
        return Object.assign(defaultToken, {
          value: layer.absoluteBoundingBox.height
        });

      case "Shadows":
        return Object.assign(defaultToken, {
          inner: layer.effects[0].type === "INNER_SHADOW",
          offset: layer.effects[0].offset,
          color: tinycolor.fromRatio({
            r: layer.effects[0].color.r,
            g: layer.effects[0].color.g,
            b: layer.effects[0].color.b,
            a: layer.effects[0].color.a,
          })
        });

      default:
        console.log(`${type} type is not supported`);
        break;
    }
  }

  async build() {
    const allTokens = await this.getTokens();
    
    this.files.forEach(file => {
      let tokens = allTokens;

      if (file.tokenTypes) {
        tokens = allTokens.filter(token => file.tokenTypes.includes(token.type));
      }

      const temp         = this.templates[file.template];
      const designTokens = [];

      tokens.forEach(token => {
        if (temp.tokens[token.type]) {
          designTokens.push(temp.tokens[token.type](token));
        }
      });

      const content = `${temp.header}\n${designTokens.join("\n")}\n${temp.footer}`;

      fs.writeFile(file.path + file.name, content, err => {
        if (err) console.log('Error writing file', err)
      });
    });
  }
}


module.exports = fibi;