const camelCase = require('lodash.camelcase');
const kebabCase = require('lodash.kebabcase');
const snakeCase = require('lodash.snakecase');
const tinycolor = require('tinycolor2');


module.exports = {
  "styles.scss": {
    header: "",
    footer: "",
    tokens: {
      "Colors"    : token => `$${token.name}: ${token.color.toRgbString()};`,
      "Spacings"  : token => `$${token.name}: ${token.value}px;`,
      "Typography": token => `$${token.name}-font-family: ${token.fontFamily};
$${token.name}-font-size: ${token.fontSize}px;
$${token.name}-line-height: ${token.lineHeight}px;
$${token.name}-letter-spacing: ${token.letterSpacing}px;`,
      "Shadows"   : token => `$${token.name}: ${token.inner ? 'inset' : '' } ${token.offset.x}px ${token.offset.y}px ${token.color.toRgbString()};`
    }
  },
  "styles.xml": {
    header: `<?xml version="1.0" encoding="UTF-8"?>\n<resources>`,
    footer: `</resources>`,
    tokens: {
      "Colors"    : token => `    <color name="${camelCase(token.name)}">#${token.color.toHex8().substr(6) + token.color.toHex8().substr(0, 6)}</color>`
    }
  },
  "colors.json": {
    header: "{",
    footer: "}",
    tokens: {
      "Colors": token => `  "${snakeCase(token.name)}": "${token.color.toHex8String()}",`
    }
  }
};