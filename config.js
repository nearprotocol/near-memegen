
let config = {
    baseUrl: 'https://studio.nearprotocol.com/contract-api',
    nodeUrl: 'https://studio.nearprotocol.com/devnet',
    contractName: 'near-memegen-devnet'
};

if (!Cookies.getJSON('fiddleConfig') || !Cookies.getJSON('fiddleConfig').nearPages) {
    Cookies.set('fiddleConfig', config);
} else {
    config = Cookies.getJSON('fiddleConfig');
}
