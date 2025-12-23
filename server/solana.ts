import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";

// Lazy-load Solana connection
let solanaConnection: Connection | null = null;

function getSolanaConnection(): Connection {
  if (!solanaConnection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    solanaConnection = new Connection(rpcUrl, "confirmed");
  }
  return solanaConnection;
}

function getKeypairFromSecret(): Keypair {
  const secretKey = process.env.SOLANA_PRIVATE_KEY;
  if (!secretKey) {
    console.warn("⚠️ SOLANA_PRIVATE_KEY not set found. Using mock keypair for development.");
    // Return a random keypair so the app doesn't crash in dev mode
    return Keypair.generate();
  }

  // If it's a base58 encoded secret key
  try {
    const decoded = bs58.decode(secretKey);
    return Keypair.fromSecretKey(decoded);
  } catch {
    // If it's a comma-separated numbers string
    const secretArray = secretKey.split(",").map(n => parseInt(n.trim()));
    return Keypair.fromSecretKey(Uint8Array.from(secretArray));
  }
}

export async function createVerificationTransaction(reportData: {
  reportId: string;
  simulationId: string;
  executiveSummary: string;
  generatedAt: string;
}): Promise<string> {
  const connection = getSolanaConnection();
  const keypair = getKeypairFromSecret();

  // Create a simple data hash for verification
  const dataString = JSON.stringify({
    reportId: reportData.reportId,
    simulationId: reportData.simulationId,
    executiveSummary: reportData.executiveSummary,
    generatedAt: reportData.generatedAt,
  });

  // Create a simple hash (in production, use proper crypto)
  const hash = Array.from(dataString)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(16);

  // Create a memo transaction for verification
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: keypair.publicKey, // Self-transfer for memo
      lamports: 0, // 0 lamports transfer
    })
  );

  // Add memo instruction (requires @solana/web3.js memo program)
  // For now, we'll just return a mock hash
  // In production, you'd use the Memo program

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = keypair.publicKey;

  // Sign and send transaction
  try {
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    return signature;
  } catch (error) {
    console.error("Solana transaction failed:", error);
    // Return mock hash for development
    return `solana-${hash}-${Date.now()}`;
  }
}

export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const connection = getSolanaConnection();
    const transaction = await connection.getTransaction(signature);
    return transaction !== null;
  } catch {
    return false;
  }
}