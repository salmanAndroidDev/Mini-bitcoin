const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid').v1;


function Blockchain(){
    this.chain = [];
    this.pendinTransactions = [];
    
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = []
    
    this.createNewBlock(100, '0', '0');  // Genesis block
}


// Create a new block and add it to the chain

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendinTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash,
    };

    this.pendinTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}


// Get the last block form the chain

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
};


// Create a new transaction

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };

    return newTransaction;
};

// Add transaction to pending transactions

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj){
    this.pendinTransactions.push(transactionObj);
    return this.getLastBlock['index'] + 1;
};

// Hashing a block

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    return sha256(dataAsString);
};

// Proof of work

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while(!hash.startsWith('0000')){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

// Get's a blockchain and returns valid this blockchain is valid or not!

Blockchain.prototype.chainIsValid = function(blockchain){
    // TODO: complete Senses algorithm
};



module.exports = Blockchain;