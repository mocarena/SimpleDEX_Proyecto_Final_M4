// Variables globales
let provider;
let signer;
let simpleDex;
let tokenA;
let tokenB;
let selectedToken;


// Direcciones de los contratos
const tokenAAddress = '0x2C0aaAfF3C9B7C8D9B7348b5512a17ecd29EDE7d';
const tokenBAddress = '0x9107AAa16D23142f2FD0f84a6bf5F8C71591D512';
const simpleDexAddress = '0x18B8FEC9acBa11586b923df2Be716d2084fFbBBf';

// Cargar ABIs desde archivos externos
async function loadABI(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Error al cargar ABI desde ${path}`);
    return await response.json();
}

// Inicializar proveedor y contratos
async function initializeProvider() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        await ethereum.request({ method: 'eth_requestAccounts' });

        const [simpleDexABI, tokenAABI, tokenBABI] = await Promise.all([
            loadABI('./Abi/Simplex.json'),
            loadABI('./Abi/TokenA.json'),
            loadABI('./Abi/TokenB.json')
        ]);

        // Instanciamos los contratos
        simpleDex = new ethers.Contract(simpleDexAddress, simpleDexABI, signer);
        tokenA = new ethers.Contract(tokenAAddress, tokenAABI, signer);
        tokenB = new ethers.Contract(tokenBAddress, tokenBABI, signer);

        // Actualizamos la interfaz de usuario
        updateWalletInfo();
    } else {
        alert('Por favor, instala Metamask!');
    }
}
// Actualizar información de gas
async function updateGasInfo() {
    try {
        
        document.getElementById('gas-amount').textContent = `${ethers.utils.formatUnits(gasPrice, "gwei")} Gwei`;
    } catch (error) {
        console.error("Error al obtener el precio del gas:", error);
        document.getElementById('gas-amount').textContent = "No disponible";
    }
}
// Actualizar la información de la wallet conectada
async function updateWalletInfo() {
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();
    const gasPrice = await provider.getGasPrice();

    // Actualizamos los datos en la interfaz
    document.getElementById('wallet-address').textContent = address;
    document.getElementById('eth-balance').textContent = ethers.utils.formatEther(balance);
    document.getElementById('network-name').textContent = network.name;
    document.getElementById('gas-amount').textContent = `${ethers.utils.formatUnits(gasPrice, "gwei")} Gwei`;

    // Mostrar la sección de funciones
    document.getElementById('wallet-info').classList.remove('hidden');
    document.getElementById('btn-connect').classList.add('hidden');
    document.getElementById('btn-disconnect').classList.remove('hidden');
}

// Función para agregar liquidez
async function addLiquidity() {
    const tokenAAmount = document.getElementById('addLiquidityTokenA').value;
    const tokenBAmount = document.getElementById('addLiquidityTokenB').value;

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
        alert('Por favor ingresa cantidades válidas');
        return;
    }

    try {
        // Aprobar los tokens antes de agregar liquidez
        await tokenA.approve(simpleDexAddress, ethers.utils.parseUnits(tokenAAmount, 18));
        await tokenB.approve(simpleDexAddress, ethers.utils.parseUnits(tokenBAmount, 18));

        // Llamar la función para agregar liquidez
        const tx = await simpleDex.addLiquidity(
            ethers.utils.parseUnits(tokenAAmount, 18),
            ethers.utils.parseUnits(tokenBAmount, 18)
        );
        await tx.wait();
        alert('Liquidez agregada exitosamente');
    } catch (error) {
        console.error('Error al agregar liquidez:', error);
        alert('Error al agregar liquidez');
    }
}

// Función para retirar liquidez
async function removeLiquidity() {
    const tokenAAmount = document.getElementById('removeLiquidityTokenA').value;
    const tokenBAmount = document.getElementById('removeLiquidityTokenB').value;

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
        alert('Por favor ingresa cantidades válidas');
        return;
    }
    try {
        // Aprobar los tokens antes de agregar liquidez
        await tokenA.approve(simpleDexAddress, ethers.utils.parseUnits(tokenAAmount, 18));
        await tokenB.approve(simpleDexAddress, ethers.utils.parseUnits(tokenBAmount, 18));
    
        // Llamar la función para retirar liquidez
        const tx = await simpleDex.removeLiquidity(
            ethers.utils.parseUnits(tokenAAmount, 18),
            ethers.utils.parseUnits(tokenBAmount, 18)
        );
        await tx.wait();
        alert('Liquidez retirada exitosamente');
    } catch (error) {
        console.error('Error al retirar liquidez:', error);
        alert('Error al retirar liquidez');
    }
}

// Función para intercambiar tokens
async function swapTokens() {
    const tokenToSwap = document.getElementById('tokenToSwap').value;
    const swapAmount = document.getElementById('swapAmount').value;

    if (swapAmount <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }

    const amountIn = ethers.utils.parseUnits(swapAmount, 18);

    try {
        let tx;
        if (tokenToSwap === 'tokenA') {
            // Aprobar Token A para el intercambio
            await tokenA.approve(simpleDexAddress, amountIn);
            tx = await simpleDex.swapAforB(amountIn);
        } else {
            // Aprobar Token B para el intercambio
            await tokenB.approve(simpleDexAddress, amountIn);
            tx = await simpleDex.swapBforA(amountIn);
        }
        await tx.wait();
        alert('Intercambio exitoso');
    } catch (error) {
        console.error('Error al intercambiar tokens:', error);
        alert('Error al intercambiar tokens');
    }
}

// Función para obtener el precio del token
async function getPrice() {
    const tokenToGetPrice = document.getElementById('tokenPrice').value; 
    let tokenAddress;

    // Determinar la dirección del token seleccionado
    if (tokenToGetPrice === 'tokenA') {
        tokenAddress = tokenAAddress;
    } else if (tokenToGetPrice === 'tokenB') {
        tokenAddress = tokenBAddress;
    } else {
        alert('Token no válido');
        return;
    }

    try {
        // Llamar a la función `getPrice` pasando la dirección del token
        const price = await simpleDex.getPrice(tokenAddress);

        // Verificar si el precio es válido antes de mostrarlo
        if (price && price.gt(0)) {
            // Mostrar el precio en la interfaz, formato adecuado
            document.getElementById('priceResult').textContent = `Precio: ${ethers.utils.formatUnits(price, 18)} ETH`;
        } else {
            document.getElementById('priceResult').textContent = "Precio no disponible";
        }
    } catch (error) {
        console.error('Error al obtener precio:', error);
        alert('Error al obtener precio');
    }
}

// Función para obtener el precio al hacer clic
document.getElementById('btn-getPrice').addEventListener('click', getPrice);


// Función para conectar la wallet
document.getElementById('btn-connect').addEventListener('click', () => {
    initializeProvider();
});

// Función para desconectar la wallet
document.getElementById('btn-disconnect').addEventListener('click', () => {
    location.reload(); // Recargar la página para "desconectar"
});

// Funciones de interacción con el contrato
document.getElementById('btn-addLiquidity').addEventListener('click', addLiquidity);
document.getElementById('btn-removeLiquidity').addEventListener('click', removeLiquidity);
document.getElementById('btn-swap').addEventListener('click', swapTokens);
document.getElementById('btn-getPrice').addEventListener('click', getTokenPrice);
