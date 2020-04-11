import targetController from './target.controller';
import burpController from './burp.controller';
import fuzzController from './fuzz.controller';
import reconController from './recon.controller';

export * from './target.route';
export * from './burp.route';
export * from './fuzz.route';
export * from './recon.route';

export {
    targetController,
    burpController,
    fuzzController,
    reconController
};