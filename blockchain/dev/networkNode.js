const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blochchain');
const uuid = require('uuid').v1;
const port = process.argv[2];
const rp = require('request-promise')


const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// get the entire chain Endpoint
app.get('/blockchain', function(req, res){
    res.send(bitcoin);
});

// send transaction to the chaing Endpoint
app.post('/transaction', function(req, res){
    const newTransaction = req.body;
    blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in ${blockIndex}.`});
});

// broadcast transaction
app.post('/transaction/broadcast', function(req, res){
    const t = req.body;
    const newTransaction = bitcoin.createNewTransaction(t.amount, t.sender, t.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
    .then( data => {
        res.json({note: 'Transaction created and broadcasted successfully.'});
    });
});


// mine a new block Endpoint
app.get('/mine', function(req, res){
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const currentBlockData = {
        transactions: bitcoin.pendinTransactions,
        index: lastBlock.index + 1
    }
    
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    
    
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock: newBlock},
            json: true
        };
        
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
    .then( data => {
        bitcoin.createNewTransaction(12.5, '00', nodeAddress);
        const requestOption = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: "00",
                recipient: nodeAddress
            },
            json: true
        };
        return rp(requestOption);
    })
    .then(data => {
        res.send({
            node: "new block mined & broadcast successfully",
            block: newBlock
        });
    });
    
    
});


// receive new block endpoint
app.post('/receive-new-block', function(req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock.index + 1 === newBlock.index;
    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendinTransactions = []; // Clear pending transactions;
        res.json({
            note: "New block received and accepted.",
            newBlock: newBlock
        });
    } else {
        res.json({
            note: "New block rejected.",
            newBlock: newBlock
        });
    }
});

// Rigister this node and broadcast it to the whole network
app.post('/register-and-broadcast-node',function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const newNodeIsNotCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    
    if (nodeNotAlreadyPresent && newNodeIsNotCurrentNode){
        bitcoin.networkNodes.push(newNodeUrl)
    }

    const regNodesPromisses = []
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
         uri: networkNodeUrl + '/register-node',
         method: 'POST',
         body: { newNodeUrl: newNodeUrl},
         json: true
        };

        regNodesPromisses.push(rp(requestOptions));
    });
    Promise.all(regNodesPromisses)
    .then( data =>{
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-node-bulk',
            method: 'POST',
            body: {allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json:true
        };
        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({not: 'New node registered with network successfully.'});
    })
});

// Register a node with the network
    app.post('/register-node', function(req, res){
        const newNodeUrl = req.body.newNodeUrl;
    
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const newNodeIsNotCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    
    if (newNodeUrl && nodeNotAlreadyPresent && newNodeIsNotCurrentNode) 
        bitcoin.networkNodes.push(newNodeUrl);
    
        res.json({node: 'new node was registerd successfully.'})

})

// Register multiple nodes at once
app.post('/register-node-bulk', function(req, res){
    const allNetworkNodes =  req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const newNodeIsNotCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if (networkNodeUrl && nodeNotAlreadyPresent && newNodeIsNotCurrentNode)
            bitcoin.networkNodes.push(networkNodeUrl);
            
    })
    res.json({node: 'bulk registration successful.'})
})






app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});