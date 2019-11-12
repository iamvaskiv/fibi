const camelCase = require('lodash.camelcase');
const kebabCase = require('lodash.kebabcase');
const snakeCase = require('lodash.snakecase');
const tinycolor = require('tinycolor2');


module.exports = {
  "styles.scss": {
    template: tokens => `${tokens}`,
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
    template: tokens => `<?xml version="1.0" encoding="UTF-8"?>
<resources>
${tokens}
</resources>`,
    tokens: {
      "Colors"    : token => `    <color name="${camelCase(token.name)}">#${token.color.toHex8().substr(6) + token.color.toHex8().substr(0, 6)}</color>`,
      "Spacings"  : token => `    <dimen name="${camelCase(token.name)}">${token.value}dp</dimen>`,
      "Typography": token => `    <dimen name="${camelCase(token.name)}FontSize">${token.fontSize}sp</dimen>
    <dimen name="${camelCase(token.name)}LineHeight">${token.lineHeight}sp</dimen>
    <dimen name="${camelCase(token.name)}LineSpacingExtra">${token.lineHeight - token.fontSize}sp</dimen>
    <dimen name="${camelCase(token.name)}LetterSpacing">${token.letterSpacing/token.fontSize}</dimen>`,
    }
  },
  "fonts.xml": {
    template: tokens => `<resources>
${tokens}
</resources>`,
    tokens: {
      "Typography": token => `<style name="${camelCase(token.name)}">
    <item name="android:textSize">@dimen/${camelCase(token.name)}FontSize</item>
    <item name="android:fontFamily">@font/${snakeCase(token.name)}_${token.fontWeight}</item>
    <item name="android:lineSpacingExtra">@dimen/${camelCase(token.name)}LineSpacingExtra</item>
    <item name="android:letterSpacing">@dimen/${camelCase(token.name)}LetterSpacing</item>
</style>`
    }
  },
  "jajaStyles.swift": {
    template: tokens => `import UIKit \nstruct Styles {
${tokens}
}`,
    tokens: {
      "Typography": token => `    static let ${camelCase(token.name)}FontFamily = "${token.fontFamily}"
    static let ${camelCase(token.name)}FontSize = CGFloat(${token.fontSize})
    static let ${camelCase(token.name)}FontWeight = "${convertWeight(token.fontWeight, token.fontFamily)}"
    static let ${camelCase(token.name)}LineHeight = CGFloat(${token.lineHeight})`,
      "Colors"    : token => {
        const {r, g, b, a} = token.color.getOriginalInput();
        return `    static let ${camelCase(token.name)} = UIColor(red: ${r.replace("%", "")/100}, green: ${g.replace("%", "")/100}, blue: ${b.replace("%", "")/100}, alpha: ${a})`;
      },
      "Spacings": token => `    static let ${camelCase(token.name)} = CGFloat(${token.value})`,
    }
  },
  "colors.json": {
    template: tokens => `{
${tokens}
}`,
    tokens: {
      "Colors": token => `"${snakeCase(token.name)}": "${token.color.toHex8String()}",`
    }
  }
};


function convertWeight(weightNumber, fontFamily) {
  switch (weightNumber) {
    case 100: return "-Thin";
    case 200: return "-Extra-Light";
    case 300: return "-Light";
    case 400: return fontFamily === "Helvetica Neue" ? "" : "-Regular";
    case 500: return "-Medium";
    case 600: return "-Semi-Bold";
    case 700: return "-Bold";
    case 800: return "Extra-Bold";
    case 900: return "-Black";
      
  
    default:
      break;
  }
}