/* eslint-disable */
function kebabCase(str) {
  var hyphenateRE = /([^-])([A-Z])/g;
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase();
}

export default function (options, components) {
  var componentNames = [];
  for (var componentsKey in components) {
    componentNames.push(kebabCase(componentsKey));
  }
  options.forEach(function (option) {
    var tag = kebabCase(option.tag);
    var has = false;
    for(var i = 0; i < componentNames.length; i++) {
      if (has) {
        continue;
      }
      var componentName = componentNames[i];
      has = componentName === tag;
    }
    if (!has) {
      components[tag] = option.component;
    }
  });
};
