// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Código de IERC20 (copiado del archivo original)
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract SimpleDEX {
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    address public owner;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event TokensSwapped(address indexed swapper, address indexed fromToken, address indexed toToken, uint256 inputAmount, uint256 outputAmount);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        owner = msg.sender;
    }

    // Función para añadir liquidez al DEX
    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        // Checks
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        // Effects
        reserveA += amountA;
        reserveB += amountB;

        // Interactions
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    // Función para intercambiar TokenA por TokenB
    function swapAforB(uint256 amountAIn) external {
        // Checks
        require(amountAIn > 0, "Input amount must be greater than 0");
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Insufficient output amount");

        // Effects
        reserveA += amountAIn;
        reserveB -= amountBOut;

        // Interactions
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountAIn);
        IERC20(tokenB).transfer(msg.sender, amountBOut);

        emit TokensSwapped(msg.sender, tokenA, tokenB, amountAIn, amountBOut);
    }

    // Función para intercambiar TokenB por TokenA
    function swapBforA(uint256 amountBIn) external {
        // Checks
        require(amountBIn > 0, "Input amount must be greater than 0");
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "Insufficient output amount");

        // Effects
        reserveB += amountBIn;
        reserveA -= amountAOut;

        // Interactions
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBIn);
        IERC20(tokenA).transfer(msg.sender, amountAOut);

        emit TokensSwapped(msg.sender, tokenB, tokenA, amountBIn, amountAOut);
    }

    // Función para retirar liquidez del DEX
    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        // Checks
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        require(amountA <= reserveA && amountB <= reserveB, "Insufficient liquidity");

        // Effects
        reserveA -= amountA;
        reserveB -= amountB;

        // Interactions
        IERC20(tokenA).transfer(msg.sender, amountA);
        IERC20(tokenB).transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    // Función para obtener el precio de un token en términos del otro
    function getPrice(address _token) external view returns (uint256) {
        if (_token == tokenA) {
            return (reserveB * 1e18) / reserveA;
        } else if (_token == tokenB) {
            return (reserveA * 1e18) / reserveB;
        } else {
            revert("Invalid token address");
        }
    }

    // Función para calcular la cantidad de tokens que se recibirán en un intercambio
    function getAmountOut(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) internal pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "Invalid reserves");
        uint256 inputAmountWithFee = inputAmount * 997; // Aplico la tarifa del 0.3%
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 1000) + inputAmountWithFee;
        return numerator / denominator;
    }
}
