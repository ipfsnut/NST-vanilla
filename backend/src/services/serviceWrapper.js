const ServiceBoundaryChecker = require('../utils/boundaryChecker');
const boundaryChecker = new ServiceBoundaryChecker();

function wrapService(service, serviceName) {
  return new Proxy(service, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        boundaryChecker.checkMethodAccess(serviceName, prop);
      }
      return target[prop];
    }
  });
}

// Usage with our existing services
const nstService = wrapService(require('./nstService'), 'NSTService');
const platformService = wrapService(new PlatformService(), 'PlatformService');
