var crypto = require('crypto');
var base58check = require('./base58check');
var SercJS = require('Serc-js');
// const NORMAL_PREFIX = 'A' // A

module.exports = {
  isAddress: function (address) {
    if (typeof address !== 'string') {
      return false
    }

    if (address.indexOf(SercJS.constants.address.prefix) != 0) { // ['A'].indexOf(address[0])
      return false
    }

    return base58check.decodeUnsafe(address.slice(SercJS.constants.address.prefix.length));
  },

  isBase58CheckAddress: function (address) {
    if (typeof address !== 'string') {
      return false
    }

    if (address.indexOf(SercJS.constants.address.prefix)) { // ['A'].indexOf(address[0]) == -1
      return false
    }

    return base58check.decodeUnsafe(address.slice(SercJS.constants.address.prefix.length));
  },

  generateBase58CheckAddress: function (publicKey) {
    if (typeof publicKey === 'string') {
      publicKey = Buffer.from(publicKey, 'hex')
    }
    var h1 = crypto.createHash('sha256').update(publicKey).digest();
    var h2 = crypto.createHash('ripemd160').update(h1).digest();
    return SercJS.constants.address.prefix + base58check.encode(h2);
  },
}