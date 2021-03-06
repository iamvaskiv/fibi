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
        if (!artboard.children) return;

        artboard.children.forEach(group => {



          if (group.type !== 'GROUP') return;
          if (group.children.length < 1) return;

          this.findToken(group.children, group, tokens);
          
          // group.children.forEach(layer => {

            

          //   if (layer.name[0] !== '$') return;
          //   const formatted = this.formatToken(layer, group.name);
          //   if (formatted) tokens.push(formatted);
          // });
        });
      })
    });

    return tokens;
  }

  findToken(layers, group, tokens) {
    layers.forEach(layer => {
      if (layer.name[0] !== '$') {
        if (layer.children === undefined || layer.children.length < 1) return;
        this.findToken(layer.children, group, tokens);

        return;
      };

      const formatted = this.formatToken(layer, group.name);
      if (formatted) tokens.push(formatted);
    });
  }

  formatToken(layer, type) {
    const { name, style } = layer;
    const defaultToken = {
      name: name.trim().replace('$', ''),
      type: type
    };

    switch (type) {
      case "Colors":
        if (!layer.fills.length) return Object.assign(defaultToken, { color: tinycolor.fromRatio({ r: 1, g: 1, b: 1, a: 0 })});

        return Object.assign(defaultToken, {
          color: tinycolor.fromRatio({
            r: layer.fills[0].color.r,
            g: layer.fills[0].color.g,
            b: layer.fills[0].color.b,
            a: layer.fills[0].opacity === undefined ? 1 : layer.fills[0].opacity,
          })
        });
      
      case "Typography":
        
        return Object.assign(defaultToken, {
          fontFamily   : style.fontFamily,
          fontSize     : style.fontSize,
          fontWeight   : style.fontWeight,
          lineHeight   : style.lineHeightPx,
          letterSpacing: style.letterSpacing !== 0 ? (style.letterSpacing).toFixed(1) : style.letterSpacing
        });

      case "Spacings":
        return Object.assign(defaultToken, {
          value: layer.absoluteBoundingBox.height
        });

      case "Shadows":
        
        return Object.assign(defaultToken, {
          shadows: layer.effects.map((shadow) => {
            return {
              inner: shadow.type === "INNER_SHADOW",
              offset: shadow.offset,
              blur: shadow.radius,
              color: tinycolor.fromRatio({
                r: shadow.color.r,
                g: shadow.color.g,
                b: shadow.color.b,
                a: shadow.color.a,
              })
            };
          })
        });

      default:
        console.log(`${type} type is not supported`);
        break;
    }
  }

  async build() {
    const allTokens = await this.getTokens();

    const defaultTemp = {
      indent: "",
      post: str => str,
    };
    
    this.files.forEach(file => {
      let tokens = allTokens;

      if (file.tokenTypes) {
        tokens = allTokens.filter(token => file.tokenTypes.includes(token.type));
      }

      const temp         = Object.assign(defaultTemp, this.templates[file.template]);
      const designTokens = [];

      tokens.forEach(token => {
        if (temp.tokens[token.type]) {
          designTokens.push(temp.tokens[token.type](token));
        }
      });

      const content = temp.template(temp.post(temp.indent + designTokens.join("\n" + temp.indent)));


      fs.writeFile(file.path + file.name, content, err => {
        if (err) console.log('Error writing file', err)
      });
    });
  }
}


module.exports = fibi;