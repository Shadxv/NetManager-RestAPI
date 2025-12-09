export class SecretNotSetError extends Error {
    constructor() {
        super('Server configuration error. Report this to administrator.');
    }
}
