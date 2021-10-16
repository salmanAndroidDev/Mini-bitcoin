const Blockchain = require('./blochchain');

const bitcoin = new Blockchain();

let data = [
    {amount: 20, sender: 'Salman1', recipient: 'Ali6'},
    {amount: 220, sender: 'Salman2', recipient: 'Ali7'},
    {amount: 2220, sender: 'Salman3', recipient: 'Ali8'},
    {amount: 22220, sender: 'Salman4', recipient: 'Ali9'},

];

data.forEach(element => {
    bitcoin.createNewTransaction(element.amount, element.sender, element.recipient);
});

const previouseBlockhash = bitcoin.getLastBlock().hash;

data = bitcoin.pendinTransactions;
const proof = bitcoin.proofOfWork(previouseBlockhash, data);
const hash = bitcoin.hashBlock(previouseBlockhash, data, proof);
if (hash.startsWith('0000')){
    bitcoin.createNewBlock(proof, previouseBlockhash, hash);
    console.log(bitcoin)
}else{
    console.log('Block is not valid')
}