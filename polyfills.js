String.prototype.capitalize = function () {
  if (!this) return '';
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.camelToTitleCase = function () {
  if (!this) return '';
  const str = this.replace(/([A-Z])/g, " $1")
  return str.charAt(0).toUpperCase() + str.slice(1);
}

String.prototype.capitalizeAll = function () {
  if (!this) return '';
  return this.split('_').map((word) => word.capitalize()).join('_');
}


String.prototype.firstCharLowerCase = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
}

String.prototype.toCamelCase = function () {
  return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

Array.prototype.toSimpleObject = function (val = true) {
  return this.reduce((res, el) => {
    return { ...res, [el]: val };
  }, {});
}

Array.prototype.toObjectByIndex = function () {
  console.log('Object.entries(this)', Object.entries(this))
  return Object.entries(this).reduce((res, [key, val]) => {
    return { ...res, [key]: val };
  }, {});
}

Array.prototype.toChunks = function (perChunk) {
  return this.reduce((all, one, i) => {
    const ch = Math.floor(i / perChunk);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, []);
}