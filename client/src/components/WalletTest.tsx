import { useWalletContext } from "@/contexts/WalletContext";

export function WalletTest() {
  const { userProfile, isConnected, walletAddress, disconnectWallet } = useWalletContext();

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Wallet Test</h3>
      <div className="space-y-2">
        <p><strong>Connected:</strong> {isConnected ? "Yes" : "No"}</p>
        <p><strong>Wallet Address:</strong> {walletAddress || "None"}</p>
        <p><strong>User Profile:</strong> {userProfile ? userProfile.name : "None"}</p>
        {userProfile && (
          <div className="mt-4">
            <img src={userProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
          </div>
        )}
        {isConnected && (
          <button
            onClick={disconnectWallet}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        )}
      </div>
    </div>
  );
}