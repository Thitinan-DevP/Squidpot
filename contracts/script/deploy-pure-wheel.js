const solc = require('solc');
const fs = require('fs');
const path = require('path');
const {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  parseUnits,
  formatUnits
} = require(path.join(__dirname, '../../frontend/node_modules/viem'));
const { privateKeyToAccount } = require(path.join(__dirname, '../../frontend/node_modules/viem/accounts'));
const { bscTestnet } = require(path.join(__dirname, '../../frontend/node_modules/viem/chains'));

// Load environment variables from .env
const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const privateKey = env.PRIVATE_KEY;
const rpcUrl = env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const piggyAddress = env.PIGGY_TOKEN_ADDRESS;
const treasuryAddress = env.ACADEMIC_TREASURY_ADDRESS;
const coordinatorAddress = env.VRF_COORDINATOR;
const subscriptionId = BigInt(env.VRF_SUBSCRIPTION_ID);
const keyHash = env.VRF_KEY_HASH;
const callbackGasLimit = Number(env.VRF_CALLBACK_GAS_LIMIT || 500000);
const requestConfirmations = Number(env.VRF_REQUEST_CONFIRMATIONS || 3);
const payInNative = env.VRF_PAY_IN_NATIVE === 'true';

const account = privateKeyToAccount(privateKey);
console.log('Deployer account:', account.address);

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(rpcUrl)
});

const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(rpcUrl)
});

function findImports(importPath) {
  let fullPath;
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    fullPath = path.join(__dirname, '../lib/openzeppelin-contracts/contracts', importPath.replace('@openzeppelin/contracts/', ''));
  } else if (importPath.startsWith('@chainlink/contracts/')) {
    fullPath = path.join(__dirname, '../lib/chainlink-evm/contracts', importPath.replace('@chainlink/contracts/', ''));
  } else {
    fullPath = path.resolve(__dirname, '..', importPath);
  }
  if (fs.existsSync(fullPath)) {
    return { contents: fs.readFileSync(fullPath, 'utf8') };
  }
  return { error: 'File not found: ' + importPath };
}

async function main() {
  console.log('1. Compiling updated SquidPot.sol...');
  const source = fs.readFileSync(path.join(__dirname, '../src/SquidPot.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources: {
      'src/SquidPot.sol': { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  if (output.errors) {
    const fatal = output.errors.filter(e => e.severity === 'error');
    if (fatal.length > 0) {
      console.error('Compilation fatal errors:', fatal);
      process.exit(1);
    }
  }

  const contract = output.contracts['src/SquidPot.sol']['SquidPot'];
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;
  console.log('   Compiled successfully! Bytecode size:', bytecode.length / 2, 'bytes');

  console.log('2. Deploying pure wheel SquidPot contract to BNB Testnet...');
  const constructorArgs = [
    piggyAddress,
    coordinatorAddress,
    treasuryAddress,
    subscriptionId,
    keyHash,
    callbackGasLimit,
    requestConfirmations,
    payInNative
  ];

  const deployHash = await walletClient.deployContract({
    abi,
    bytecode,
    args: constructorArgs
  });
  console.log('   Deploy tx submitted:', deployHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const newAddress = receipt.contractAddress;
  console.log('   >>> New SquidPot deployed at:', newAddress);

  console.log('3. Registering consumer with Chainlink VRF Coordinator...');
  const coordAbi = parseAbi([
    'function addConsumer(uint256 subId, address consumer)'
  ]);

  const addConsumerHash = await walletClient.writeContract({
    address: coordinatorAddress,
    abi: coordAbi,
    functionName: 'addConsumer',
    args: [subscriptionId, newAddress]
  });
  console.log('   addConsumer tx:', addConsumerHash);
  await publicClient.waitForTransactionReceipt({ hash: addConsumerHash });
  console.log('   Chainlink VRF consumer registered successfully!');

  console.log('4. Approving and initializing reserve funding (500 PIGGY)...');
  const piggyAbi = parseAbi([
    'function approve(address spender, uint256 amount) returns (bool)'
  ]);
  const seedAmount = parseUnits('500', 18);

  const approveHash = await walletClient.writeContract({
    address: piggyAddress,
    abi: piggyAbi,
    functionName: 'approve',
    args: [newAddress, seedAmount]
  });
  console.log('   approve tx:', approveHash);
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  const initHash = await walletClient.writeContract({
    address: newAddress,
    abi,
    functionName: 'initializeFunding',
    args: []
  });
  console.log('   initializeFunding tx:', initHash);
  await publicClient.waitForTransactionReceipt({ hash: initHash });

  console.log('5. Verifying deployed contract state...');
  const [initDone, reserve, phase] = await Promise.all([
    publicClient.readContract({ address: newAddress, abi, functionName: 'fundingInitialized' }),
    publicClient.readContract({ address: newAddress, abi, functionName: 'availableSlotReserve' }),
    publicClient.readContract({ address: newAddress, abi, functionName: 'roundStatus' })
  ]);

  console.log({
    address: newAddress,
    fundingInitialized: initDone,
    availableSlotReserve: formatUnits(reserve, 18) + ' $PIGGY',
    roundStatus: phase // 1 = OPEN
  });

  console.log('\nDeployment and Initialization completed successfully!');
  console.log('NEW_SQUIDPOT_ADDRESS=' + newAddress);
}

main().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
