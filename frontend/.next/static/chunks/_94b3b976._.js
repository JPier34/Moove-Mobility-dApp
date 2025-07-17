(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/hooks/useWeb3.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useWeb3": (()=>useWeb3)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-client] (ecmascript) <export * as ethers>");
(()=>{
    const e = new Error("Cannot find module '@metamask/detect-provider'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var _s = __turbopack_context__.k.signature();
;
;
;
function useWeb3() {
    _s();
    const [web3State, setWeb3State] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        provider: null,
        signer: null,
        account: null,
        chainId: null,
        isConnected: false,
        isLoading: false,
        error: null
    });
    const connectWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWeb3.useCallback[connectWallet]": async ()=>{
            setWeb3State({
                "useWeb3.useCallback[connectWallet]": (prev)=>({
                        ...prev,
                        isLoading: true,
                        error: null
                    })
            }["useWeb3.useCallback[connectWallet]"]);
            try {
                const detectedProvider = await detectEthereumProvider();
                if (!detectedProvider) {
                    throw new Error("MetaMask not detected. Please install MetaMask.");
                }
                const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].BrowserProvider(window.ethereum);
                // Request account access
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const account = await signer.getAddress();
                const network = await provider.getNetwork();
                setWeb3State({
                    provider,
                    signer,
                    account,
                    chainId: Number(network.chainId),
                    isConnected: true,
                    isLoading: false,
                    error: null
                });
            } catch (error) {
                setWeb3State({
                    "useWeb3.useCallback[connectWallet]": (prev)=>({
                            ...prev,
                            isLoading: false,
                            error: error instanceof Error ? error.message : "Failed to connect wallet"
                        })
                }["useWeb3.useCallback[connectWallet]"]);
            }
        }
    }["useWeb3.useCallback[connectWallet]"], []);
    const disconnectWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWeb3.useCallback[disconnectWallet]": ()=>{
            setWeb3State({
                provider: null,
                signer: null,
                account: null,
                chainId: null,
                isConnected: false,
                isLoading: false,
                error: null
            });
        }
    }["useWeb3.useCallback[disconnectWallet]"], []);
    const switchNetwork = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWeb3.useCallback[switchNetwork]": async (targetChainId)=>{
            if (!window.ethereum) return;
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [
                        {
                            chainId: `0x${targetChainId.toString(16)}`
                        }
                    ]
                });
            } catch (error) {
                // Chain not added to MetaMask
                if (error.code === 4902) {
                    const networkConfig = getNetworkConfig(targetChainId);
                    if (networkConfig) {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                networkConfig
                            ]
                        });
                    }
                }
            }
        }
    }["useWeb3.useCallback[switchNetwork]"], []);
    // Listen for account/chain changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useWeb3.useEffect": ()=>{
            if (!window.ethereum) return;
            const handleAccountsChanged = {
                "useWeb3.useEffect.handleAccountsChanged": (accounts)=>{
                    if (accounts.length === 0) {
                        disconnectWallet();
                    } else {
                        connectWallet();
                    }
                }
            }["useWeb3.useEffect.handleAccountsChanged"];
            const handleChainChanged = {
                "useWeb3.useEffect.handleChainChanged": ()=>{
                    window.location.reload(); // Recommended by MetaMask
                }
            }["useWeb3.useEffect.handleChainChanged"];
            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);
            return ({
                "useWeb3.useEffect": ()=>{
                    window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
                    window.ethereum?.removeListener("chainChanged", handleChainChanged);
                }
            })["useWeb3.useEffect"];
        }
    }["useWeb3.useEffect"], [
        connectWallet,
        disconnectWallet
    ]);
    return {
        ...web3State,
        connectWallet,
        disconnectWallet,
        switchNetwork
    };
}
_s(useWeb3, "0PxZtxxEcIineqKPyfCxWiVRba8=");
function getNetworkConfig(chainId) {
    const configs = {
        11155111: {
            // Sepolia
            chainId: "0xaa36a7",
            chainName: "Sepolia test network",
            rpcUrls: [
                "https://sepolia.infura.io/v3/"
            ],
            blockExplorerUrls: [
                "https://sepolia.etherscan.io/"
            ],
            nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18
            }
        }
    };
    return configs[chainId];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/providers/Web3Provider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Web3Provider),
    "useWeb3Context": (()=>useWeb3Context)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useWeb3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useWeb3.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const Web3Context = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function useWeb3Context() {
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(Web3Context);
    if (!context) {
        throw new Error("useWeb3Context must be used within Web3Provider");
    }
    return context;
}
_s(useWeb3Context, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function Web3Provider({ children }) {
    _s1();
    const web3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useWeb3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWeb3"])();
    // Show toast notifications for connection events
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "Web3Provider.useEffect": ()=>{
            if (web3.error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].error(web3.error);
            }
        }
    }["Web3Provider.useEffect"], [
        web3.error
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "Web3Provider.useEffect": ()=>{
            if (web3.isConnected && web3.account) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].success(`Connected to ${web3.account.slice(0, 6)}...${web3.account.slice(-4)}`);
            }
        }
    }["Web3Provider.useEffect"], [
        web3.isConnected,
        web3.account
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Web3Context.Provider, {
        value: web3,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
                position: "top-right",
                toastOptions: {
                    duration: 4000,
                    style: {
                        background: "#363636",
                        color: "#fff"
                    }
                }
            }, void 0, false, {
                fileName: "[project]/providers/Web3Provider.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/providers/Web3Provider.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_s1(Web3Provider, "5Ov9DNfhxV1Zivzo8jYbYIMvv5g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useWeb3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWeb3"]
    ];
});
_c = Web3Provider;
var _c;
__turbopack_context__.k.register(_c, "Web3Provider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ui/Button.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Button)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
;
function Button({ variant = "primary", size = "md", isLoading = false, className, children, disabled, ...props }) {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantClasses = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };
    const sizeClasses = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(baseClasses, variantClasses[variant], sizeClasses[size], (disabled || isLoading) && "opacity-50 cursor-not-allowed", className),
        disabled: disabled || isLoading,
        ...props,
        children: [
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "animate-spin -ml-1 mr-3 h-5 w-5",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        className: "opacity-25",
                        cx: "12",
                        cy: "12",
                        r: "10",
                        stroke: "currentColor",
                        strokeWidth: "4"
                    }, void 0, false, {
                        fileName: "[project]/components/ui/Button.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        className: "opacity-75",
                        fill: "currentColor",
                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }, void 0, false, {
                        fileName: "[project]/components/ui/Button.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ui/Button.tsx",
                lineNumber: 50,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/components/ui/Button.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c = Button;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/types/auction.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuctionStatus": (()=>AuctionStatus),
    "AuctionType": (()=>AuctionType)
});
var AuctionType = /*#__PURE__*/ function(AuctionType) {
    AuctionType[AuctionType["TRADITIONAL"] = 0] = "TRADITIONAL";
    AuctionType[AuctionType["ENGLISH"] = 1] = "ENGLISH";
    AuctionType[AuctionType["DUTCH"] = 2] = "DUTCH";
    AuctionType[AuctionType["SEALED_BID"] = 3] = "SEALED_BID";
    return AuctionType;
}({});
var AuctionStatus = /*#__PURE__*/ function(AuctionStatus) {
    AuctionStatus[AuctionStatus["ACTIVE"] = 0] = "ACTIVE";
    AuctionStatus[AuctionStatus["ENDED"] = 1] = "ENDED";
    AuctionStatus[AuctionStatus["CANCELLED"] = 2] = "CANCELLED";
    AuctionStatus[AuctionStatus["REVEALING"] = 3] = "REVEALING";
    return AuctionStatus;
}({});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/types/nft.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "VehicleType": (()=>VehicleType)
});
var VehicleType = /*#__PURE__*/ function(VehicleType) {
    VehicleType[VehicleType["BIKE"] = 0] = "BIKE";
    VehicleType[VehicleType["SCOOTER"] = 1] = "SCOOTER";
    VehicleType[VehicleType["MONOPATTINO"] = 2] = "MONOPATTINO";
    return VehicleType;
}({});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/utils/helpers.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "MOOVE_NFT_ABI": (()=>MOOVE_NFT_ABI),
    "createMooveNFTContract": (()=>createMooveNFTContract),
    "formatPrice": (()=>formatPrice),
    "formatTimeRemaining": (()=>formatTimeRemaining),
    "getAuctionStatusName": (()=>getAuctionStatusName),
    "getAuctionTypeName": (()=>getAuctionTypeName),
    "getExplorerUrl": (()=>getExplorerUrl),
    "getVehicleTypeName": (()=>getVehicleTypeName),
    "parsePrice": (()=>parsePrice),
    "truncateAddress": (()=>truncateAddress)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/formatEther.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/parseEther.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/auction.ts [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@factories/contracts/interfaces/IMooveVehicleNFT__factory'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$nft$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/nft.ts [app-client] (ecmascript)");
;
;
;
;
const MOOVE_NFT_ABI = IMooveVehicleNFT__factory.abi;
function createMooveNFTContract(address, runner) {
    return IMooveVehicleNFT__factory.connect(address, runner);
}
function formatPrice(price) {
    return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatEther"])(price)} ETH`;
}
function parsePrice(price) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseEther$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseEther"])(price);
}
function getVehicleTypeName(type) {
    const names = {
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$nft$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VehicleType"].BIKE]: "Electric Bike",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$nft$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VehicleType"].SCOOTER]: "Electric Scooter",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$nft$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VehicleType"].MONOPATTINO]: "Electric Monopattino"
    };
    return names[type] || "Unknown Vehicle";
}
function getAuctionTypeName(type) {
    const names = {
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionType"].TRADITIONAL]: "Traditional",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionType"].ENGLISH]: "English",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionType"].DUTCH]: "Dutch",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionType"].SEALED_BID]: "Sealed Bid"
    };
    return names[type] || "Unknown Auction";
}
function getAuctionStatusName(status) {
    const names = {
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionStatus"].ACTIVE]: "Active",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionStatus"].ENDED]: "Ended",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionStatus"].CANCELLED]: "Cancelled",
        [__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$auction$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuctionStatus"].REVEALING]: "Revealing"
    };
    return names[status] || "Unknown Status";
}
function formatTimeRemaining(endTime) {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const remaining = end - now;
    if (remaining <= 0) return "Ended";
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor(remaining % 86400 / 3600);
    const minutes = Math.floor(remaining % 3600 / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
function truncateAddress(address, length = 6) {
    if (!address) return "";
    return `${address.slice(0, length)}...${address.slice(-4)}`;
}
function getExplorerUrl(hash, type = "tx") {
    const baseUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.etherscan.io";
    return `${baseUrl}/${type}/${hash}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/wallet/WalletButton.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>WalletButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$providers$2f$Web3Provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/providers/Web3Provider.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/helpers.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function WalletButton() {
    _s();
    const { account, isConnected, isLoading, connectWallet, disconnectWallet, chainId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$providers$2f$Web3Provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWeb3Context"])();
    const SEPOLIA_CHAIN_ID = 11155111;
    const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            isLoading: true,
            disabled: true,
            children: "Connecting..."
        }, void 0, false, {
            fileName: "[project]/components/wallet/WalletButton.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this);
    }
    if (!isConnected) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            onClick: connectWallet,
            children: "Connect Wallet"
        }, void 0, false, {
            fileName: "[project]/components/wallet/WalletButton.tsx",
            lineNumber: 30,
            columnNumber: 12
        }, this);
    }
    if (isWrongNetwork) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            variant: "danger",
            onClick: ()=>window.location.reload(),
            children: "Wrong Network"
        }, void 0, false, {
            fileName: "[project]/components/wallet/WalletButton.tsx",
            lineNumber: 35,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm text-gray-600",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$helpers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["truncateAddress"])(account || "")
            }, void 0, false, {
                fileName: "[project]/components/wallet/WalletButton.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                variant: "outline",
                size: "sm",
                onClick: disconnectWallet,
                children: "Disconnect"
            }, void 0, false, {
                fileName: "[project]/components/wallet/WalletButton.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/wallet/WalletButton.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_s(WalletButton, "dNg+fI/BcVRy5WDYBIg29OT5x6Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$providers$2f$Web3Provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWeb3Context"]
    ];
});
_c = WalletButton;
var _c;
__turbopack_context__.k.register(_c, "WalletButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/layout/Header.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Header)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$wallet$2f$WalletButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/wallet/WalletButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const navigation = [
    {
        name: "Marketplace",
        href: "/marketplace"
    },
    {
        name: "Auctions",
        href: "/auctions"
    },
    {
        name: "My Collection",
        href: "/my-collection"
    }
];
function Header() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "bg-white shadow-sm border-b border-gray-200",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center h-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-2xl font-bold text-moove-600",
                                children: "Moove"
                            }, void 0, false, {
                                fileName: "[project]/components/layout/Header.tsx",
                                lineNumber: 24,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 text-sm text-gray-500",
                                children: "NFT"
                            }, void 0, false, {
                                fileName: "[project]/components/layout/Header.tsx",
                                lineNumber: 25,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/layout/Header.tsx",
                        lineNumber: 23,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "hidden md:flex space-x-8",
                        children: navigation.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("px-3 py-2 text-sm font-medium transition-colors", pathname === item.href ? "text-moove-600 border-b-2 border-moove-600" : "text-gray-700 hover:text-moove-600"),
                                children: item.name
                            }, item.name, false, {
                                fileName: "[project]/components/layout/Header.tsx",
                                lineNumber: 31,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/layout/Header.tsx",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$wallet$2f$WalletButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/components/layout/Header.tsx",
                        lineNumber: 47,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/layout/Header.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/layout/Header.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/layout/Header.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_s(Header, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_94b3b976._.js.map